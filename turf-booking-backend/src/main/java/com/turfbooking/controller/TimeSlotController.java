package com.turfbooking.controller;

import com.turfbooking.dto.TimeSlotDto;
import com.turfbooking.dto.TimeSlotGenerateRequest;
import com.turfbooking.service.TimeSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    @GetMapping("/turfs/{turfId}/slots")
    public ResponseEntity<List<TimeSlotDto>> getSlots(
            @PathVariable Long turfId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(timeSlotService.getSlotsForTurfAndDate(turfId, date));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/turfs/{turfId}/slots/generate")
    public ResponseEntity<List<TimeSlotDto>> generateSlots(
            @PathVariable Long turfId,
            @RequestBody TimeSlotGenerateRequest request) {
        return ResponseEntity.ok(timeSlotService.generateSlots(turfId, request));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PutMapping("/slots/{id}/block")
    public ResponseEntity<TimeSlotDto> blockSlot(@PathVariable Long id) {
        return ResponseEntity.ok(timeSlotService.blockSlot(id));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PutMapping("/slots/{id}/unblock")
    public ResponseEntity<TimeSlotDto> unblockSlot(@PathVariable Long id) {
        return ResponseEntity.ok(timeSlotService.unblockSlot(id));
    }
}
