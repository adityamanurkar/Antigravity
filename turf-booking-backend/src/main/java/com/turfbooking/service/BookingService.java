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
    private final EmailService emailService;
    private final SmsService smsService;

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

        Booking booking = Booking.builder()
                .user(user)
                .turf(turf)
                .timeSlot(slot)
                .numberOfPlayers(request.getNumberOfPlayers())
                .totalPrice(turf.getPricePerHour()) // Assuming price is per slot for simplicity
                .status(BookingStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.PENDING)
                .bookingRef(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        // Award loyalty points (Null-safe)
        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(currentPoints + 100);
        userRepository.save(user);

        Booking savedBooking = bookingRepository.save(booking);
        
        // Trigger simulated email
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

        return mapToDto(savedBooking);
    }

    @Transactional(readOnly = true)
    public Page<BookingDto> getMyBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable).map(this::mapToDto);
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

    private BookingDto mapToDto(Booking booking) {
        TimeSlotDto slotDto = TimeSlotDto.builder()
                .id(booking.getTimeSlot().getId())
                .turfId(booking.getTurf().getId())
                .slotDate(booking.getTimeSlot().getSlotDate())
                .startTime(booking.getTimeSlot().getStartTime())
                .endTime(booking.getTimeSlot().getEndTime())
                .status(booking.getTimeSlot().getStatus())
                .build();

        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .turfId(booking.getTurf().getId())
                .timeSlot(slotDto)
                .numberOfPlayers(booking.getNumberOfPlayers())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .bookingRef(booking.getBookingRef())
                .build();
    }
}
