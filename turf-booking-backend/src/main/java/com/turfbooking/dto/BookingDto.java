package com.turfbooking.dto;

import com.turfbooking.entity.enums.BookingStatus;
import com.turfbooking.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingDto {
    private Long id;
    private Long userId;
    private Long turfId;
    private TimeSlotDto timeSlot;
    private Integer numberOfPlayers;
    private BigDecimal totalPrice;
    private BookingStatus status;
    private PaymentStatus paymentStatus;
    private String bookingRef;
    private String transactionId;
    private String userName;
    private String userEmail;
    private String turfName;
    private boolean reviewed;
}
