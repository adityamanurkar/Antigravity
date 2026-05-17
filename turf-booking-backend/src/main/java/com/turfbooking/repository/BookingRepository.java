package com.turfbooking.repository;

import com.turfbooking.entity.Booking;
import com.turfbooking.entity.enums.BookingStatus;
import com.turfbooking.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findByUserId(Long userId, Pageable pageable);
    Page<Booking> findByTurfId(Long turfId, Pageable pageable);
    List<Booking> findByTurfId(Long turfId);
    
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.paymentStatus = :paymentStatus AND b.createdAt < :cutoffTime")
    List<Booking> findUnpaidBookingsOlderThan(@Param("status") BookingStatus status, @Param("paymentStatus") PaymentStatus paymentStatus, @Param("cutoffTime") LocalDateTime cutoffTime);
}
