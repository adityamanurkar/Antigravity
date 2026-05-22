package com.turfbooking.controller;

import com.turfbooking.dto.ReviewDto;
import com.turfbooking.dto.ReviewRequest;
import com.turfbooking.security.UserDetailsImpl;
import com.turfbooking.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(
            @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(reviewService.createReview(request, userDetails.getId()));
    }

    @GetMapping("/turf/{turfId}")
    public ResponseEntity<Page<ReviewDto>> getTurfReviews(
            @PathVariable Long turfId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviewsByTurf(turfId, PageRequest.of(page, size)));
    }
}
