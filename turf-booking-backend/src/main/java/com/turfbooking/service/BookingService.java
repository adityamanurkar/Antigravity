package com.turfbooking.service;

import com.turfbooking.dto.BookingDto;
import com.turfbooking.dto.BookingRequest;
import com.turfbooking.dto.TimeSlotDto;
import com.turfbooking.entity.Booking;
import com.turfbooking.entity.TimeSlot;
import com.turfbooking.entity.Turf;
import com.turfbooking.entity.User;
import com.turfbooking.entity.enums.BookingStatus;
import com.turfbooking.entity.enums.PaymentStatus;
import com.turfbooking.entity.enums.SlotStatus;
import com.turfbooking.exception.BadRequestException;
import com.turfbooking.exception.ResourceNotFoundException;
import com.turfbooking.repository.BookingRepository;
import com.turfbooking.repository.TimeSlotRepository;
import com.turfbooking.repository.TurfRepository;
import com.turfbooking.repository.UserRepository;
import com.turfbooking.repository.PaymentRepository;
import com.turfbooking.repository.ReviewRepository;
import com.turfbooking.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final TurfRepository turfRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationService notificationService;

    @Transactional
    public BookingDto createBooking(BookingRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Turf turf = turfRepository.findById(request.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
        TimeSlot slot = timeSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        if (!slot.getTurf().getId().equals(turf.getId())) {
            throw new BadRequestException("Slot does not belong to this turf");
        }

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available");
        }

        // Optimistic locking will handle race conditions
        slot.setStatus(SlotStatus.BOOKED);
        timeSlotRepository.save(slot);

        boolean isPaid = request.getTransactionId() != null && !request.getTransactionId().trim().isEmpty();

        Booking booking = Booking.builder()
                .user(user)
                .turf(turf)
                .timeSlot(slot)
                .numberOfPlayers(request.getNumberOfPlayers())
                .totalPrice(turf.getPricePerHour()) // Assuming price is per slot for simplicity
                .status(BookingStatus.CONFIRMED)
                .paymentStatus(isPaid ? PaymentStatus.PENDING_VERIFICATION : PaymentStatus.PENDING)
                .bookingRef(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Save a Payment record to database
        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(savedBooking.getTotalPrice())
                .paymentMethod("UPI")
                .transactionId(isPaid ? request.getTransactionId().trim() : "PENDING_" + savedBooking.getBookingRef())
                .status(isPaid ? PaymentStatus.PENDING_VERIFICATION : PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        if (isPaid) {
            // Do not award loyalty points yet. Points will be awarded when owner verifies.
            
            // Trigger simulated email for pending verification
            emailService.sendBookingConfirmation(
                user.getEmail(), 
                user.getName(), 
                turf.getName(), 
                slot.getSlotDate().toString(), 
                slot.getStartTime().toString(), 
                savedBooking.getBookingRef()
            );

            // Trigger real-time SMS
            if (user.getPhone() != null && !user.getPhone().isEmpty()) {
                smsService.sendBookingSms(
                    user.getPhone(), 
                    user.getName(), 
                    turf.getName(), 
                    slot.getSlotDate().toString(), 
                    slot.getStartTime().toString(), 
                    savedBooking.getBookingRef()
                );
            }
        }

        // Notify Owner of new booking
        notificationService.createNotification(
            turf.getOwner(),
            "New Booking Recieved",
            "A new booking has been made for turf " + turf.getName() + " on " + slot.getSlotDate() + " at " + slot.getStartTime() + " by " + user.getName()
        );

        return mapToDto(savedBooking);
    }

    @Transactional(readOnly = true)
    public Page<BookingDto> getMyBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<BookingDto> getOwnerBookings(Long ownerId, PaymentStatus paymentStatus, Pageable pageable) {
        if (paymentStatus != null) {
            return bookingRepository.findByTurfOwnerIdAndPaymentStatus(ownerId, paymentStatus, pageable).map(this::mapToDto);
        } else {
            return bookingRepository.findByTurfOwnerId(ownerId, pageable).map(this::mapToDto);
        }
    }

    @Transactional
    public BookingDto cancelBooking(Long id, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to cancel this booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.getTimeSlot().setStatus(SlotStatus.AVAILABLE);
        
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto verifyPayment(Long bookingId, boolean approved, Long ownerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
                
        if (!booking.getTurf().getOwner().getId().equals(ownerId)) {
            throw new BadRequestException("Not authorized to verify payment for this turf");
        }
        
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (approved) {
            booking.setPaymentStatus(PaymentStatus.PAID);
            payment.setStatus(PaymentStatus.PAID);
            
            // Award loyalty points
            User user = booking.getUser();
            int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
            user.setLoyaltyPoints(currentPoints + 100);
            userRepository.save(user);

            // Notify player of approval
            notificationService.createNotification(
                booking.getUser(),
                "Payment Approved",
                "Your payment for booking #" + booking.getBookingRef() + " at " + booking.getTurf().getName() + " has been verified. 100 loyalty points awarded!"
            );
        } else {
            booking.setPaymentStatus(PaymentStatus.FAILED);
            payment.setStatus(PaymentStatus.FAILED);
            booking.setStatus(BookingStatus.CANCELLED);
            booking.getTimeSlot().setStatus(SlotStatus.AVAILABLE);

            // Notify player of rejection
            notificationService.createNotification(
                booking.getUser(),
                "Payment Verification Failed",
                "Your payment for booking #" + booking.getBookingRef() + " at " + booking.getTurf().getName() + " was rejected. The booking has been cancelled and slot released."
            );
        }

        paymentRepository.save(payment);
        return mapToDto(bookingRepository.save(booking));
    }

    private BookingDto mapToDto(Booking booking) {
        TimeSlotDto slotDto = TimeSlotDto.builder()
                .id(booking.getTimeSlot().getId())
                .turfId(booking.getTurf().getId())
                .slotDate(booking.getTimeSlot().getSlotDate())
                .startTime(booking.getTimeSlot().getStartTime())
                .endTime(booking.getTimeSlot().getEndTime())
                .status(booking.getTimeSlot().getStatus())
                .build();

        String transactionId = paymentRepository.findByBookingId(booking.getId())
                .map(Payment::getTransactionId)
                .orElse(null);

        boolean reviewed = reviewRepository.existsByBookingId(booking.getId());

        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .userEmail(booking.getUser().getEmail())
                .turfId(booking.getTurf().getId())
                .turfName(booking.getTurf().getName())
                .timeSlot(slotDto)
                .numberOfPlayers(booking.getNumberOfPlayers())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .bookingRef(booking.getBookingRef())
                .transactionId(transactionId)
                .reviewed(reviewed)
                .build();
    }
}
