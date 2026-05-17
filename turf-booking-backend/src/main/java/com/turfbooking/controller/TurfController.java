package com.turfbooking.controller;

import com.turfbooking.dto.TurfCreateRequest;
import com.turfbooking.dto.TurfDto;
import com.turfbooking.entity.enums.TurfStatus;
import com.turfbooking.security.UserDetailsImpl;
import com.turfbooking.service.TurfService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turfs")
@RequiredArgsConstructor
public class TurfController {

    private final TurfService turfService;

    @GetMapping
    public ResponseEntity<Page<TurfDto>> getAllTurfs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(turfService.getAllApprovedTurfs(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurfDto> getTurfById(@PathVariable Long id) {
        return ResponseEntity.ok(turfService.getTurfById(id));
    }

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping
    public ResponseEntity<TurfDto> createTurf(
            @RequestBody TurfCreateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(turfService.createTurf(request, userDetails.getId()));
    }

    @PreAuthorize("hasRole('OWNER')")
    @GetMapping("/my")
    public ResponseEntity<List<TurfDto>> getMyTurfs(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(turfService.getTurfsByOwner(userDetails.getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<TurfDto> updateTurfStatus(@PathVariable Long id, @RequestParam TurfStatus status) {
        return ResponseEntity.ok(turfService.updateTurfStatus(id, status));
    }
}
