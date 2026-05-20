package com.turfbooking.service;

import com.turfbooking.dto.TimeSlotDto;
import com.turfbooking.dto.TimeSlotGenerateRequest;
import com.turfbooking.entity.TimeSlot;
import com.turfbooking.entity.Turf;
import com.turfbooking.entity.enums.SlotStatus;
import com.turfbooking.exception.ResourceNotFoundException;
import com.turfbooking.repository.TimeSlotRepository;
import com.turfbooking.repository.TurfRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final TurfRepository turfRepository;

    @Transactional(readOnly = true)
    public List<TimeSlotDto> getSlotsForTurfAndDate(Long turfId, LocalDate date) {
        return timeSlotRepository.findByTurfIdAndSlotDate(turfId, date).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TimeSlotDto> generateSlots(Long turfId, TimeSlotGenerateRequest request, Long ownerId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
        validateTurfOwner(turf, ownerId);
        
        List<TimeSlot> slots = new ArrayList<>();
        LocalDate currentDate = request.getStartDate();

        while (!currentDate.isAfter(request.getEndDate())) {
            LocalTime currentTime = turf.getOpeningTime();
            while (true) {
                LocalTime endTime = currentTime.plusMinutes(request.getSlotDurationMinutes());
                
                if (endTime.isBefore(currentTime) || endTime.isAfter(turf.getClosingTime())) {
                    break;
                }
                
                boolean exists = timeSlotRepository.existsByTurfIdAndSlotDateAndStartTime(
                    turf.getId(), currentDate, currentTime
                );

                if (!exists) {
                    TimeSlot slot = TimeSlot.builder()
                            .turf(turf)
                            .slotDate(currentDate)
                            .startTime(currentTime)
                            .endTime(endTime)
                            .status(SlotStatus.AVAILABLE)
                            .build();
                    slots.add(slot);
                }
                
                currentTime = endTime;
                
                if (currentTime.equals(turf.getClosingTime())) {
                    break;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        return timeSlotRepository.saveAll(slots).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TimeSlotDto blockSlot(Long id, Long ownerId) {
        TimeSlot slot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        validateTurfOwner(slot.getTurf(), ownerId);
        slot.setStatus(SlotStatus.BLOCKED);
        return mapToDto(timeSlotRepository.save(slot));
    }

    @Transactional
    public TimeSlotDto unblockSlot(Long id, Long ownerId) {
        TimeSlot slot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        validateTurfOwner(slot.getTurf(), ownerId);
        slot.setStatus(SlotStatus.AVAILABLE);
        return mapToDto(timeSlotRepository.save(slot));
    }

    private void validateTurfOwner(Turf turf, Long ownerId) {
        if (!turf.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("You are not allowed to manage this turf");
        }
    }

    private TimeSlotDto mapToDto(TimeSlot slot) {
        return TimeSlotDto.builder()
                .id(slot.getId())
                .turfId(slot.getTurf().getId())
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status(slot.getStatus())
                .build();
    }
}
