package com.turfbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TimeSlotGenerateRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    private int slotDurationMinutes;
}
