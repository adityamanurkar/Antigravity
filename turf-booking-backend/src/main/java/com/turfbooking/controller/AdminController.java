package com.turfbooking.controller;

import com.turfbooking.dto.TurfDto;
import com.turfbooking.dto.UserDto;
import com.turfbooking.entity.User;
import com.turfbooking.entity.enums.TurfStatus;
import com.turfbooking.repository.UserRepository;
import com.turfbooking.service.TurfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import com.turfbooking.repository.BookingRepository;
import com.turfbooking.dto.BookingDto;
import com.turfbooking.entity.Booking;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final TurfService turfService;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @GetMapping("/turfs")
    public ResponseEntity<List<TurfDto>> getTurfs(@RequestParam(required = false) TurfStatus status) {
        return ResponseEntity.ok(turfService.getAllTurfsForAdmin(status));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(this::mapToDto).toList());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserDto> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(!user.getIsActive());
        return ResponseEntity.ok(mapToDto(userRepository.save(user)));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> getBookings() {
        return ResponseEntity.ok(bookingRepository.findAll().stream().map(this::mapBookingToDto).toList());
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(com.turfbooking.entity.enums.BookingStatus.CANCELLED);
        booking.getTimeSlot().setStatus(com.turfbooking.entity.enums.SlotStatus.AVAILABLE);
        return ResponseEntity.ok(mapBookingToDto(bookingRepository.save(booking)));
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .profilePicUrl(user.getProfilePicUrl())
                .loyaltyPoints(user.getLoyaltyPoints())
                .isActive(user.getIsActive())
                .build();
    }

    private BookingDto mapBookingToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .bookingRef(booking.getBookingRef())
                .turfId(booking.getTurf().getId())
                .userId(booking.getUser().getId())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .timeSlot(com.turfbooking.dto.TimeSlotDto.builder()
                        .id(booking.getTimeSlot().getId())
                        .turfId(booking.getTimeSlot().getTurf().getId())
                        .slotDate(booking.getTimeSlot().getSlotDate())
                        .startTime(booking.getTimeSlot().getStartTime())
                        .endTime(booking.getTimeSlot().getEndTime())
                        .price(booking.getTimeSlot().getPrice())
                        .status(booking.getTimeSlot().getStatus())
                        .build())
                .build();
    }
}
