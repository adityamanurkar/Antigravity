package com.turfbooking.repository;

import com.turfbooking.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByTurfIdAndSlotDate(Long turfId, LocalDate slotDate);
    List<TimeSlot> findByTurfIdAndSlotDateBetween(Long turfId, LocalDate startDate, LocalDate endDate);
    boolean existsByTurfIdAndSlotDateAndStartTime(Long turfId, LocalDate slotDate, java.time.LocalTime startTime);
}
