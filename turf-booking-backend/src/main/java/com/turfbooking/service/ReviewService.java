package com.turfbooking.service;

import com.turfbooking.dto.ReviewDto;
import com.turfbooking.dto.ReviewRequest;
import com.turfbooking.entity.Booking;
import com.turfbooking.entity.Review;
import com.turfbooking.entity.Turf;
import com.turfbooking.entity.enums.PaymentStatus;
import com.turfbooking.exception.BadRequestException;
import com.turfbooking.exception.ResourceNotFoundException;
import com.turfbooking.repository.BookingRepository;
import com.turfbooking.repository.ReviewRepository;
import com.turfbooking.repository.TurfRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final TurfRepository turfRepository;

    @Transactional
    public ReviewDto createReview(ReviewRequest request, Long userId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to review this booking");
        }

        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Cannot review an unpaid booking");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new BadRequestException("You have already reviewed this booking");
        }

        Review review = Review.builder()
                .user(booking.getUser())
                .turf(booking.getTurf())
                .booking(booking)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalculate average rating & review count for turf
        Turf turf = booking.getTurf();
        double currentAvg = turf.getAverageRating() != null ? turf.getAverageRating() : 0.0;
        int currentCount = turf.getReviewCount() != null ? turf.getReviewCount() : 0;

        double newAvg = ((currentAvg * currentCount) + request.getRating()) / (currentCount + 1);
        turf.setAverageRating(newAvg);
        turf.setReviewCount(currentCount + 1);
        turfRepository.save(turf);

        return mapToDto(savedReview);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getReviewsByTurf(Long turfId, Pageable pageable) {
        return reviewRepository.findByTurfId(turfId, pageable).map(this::mapToDto);
    }

    private ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .turfId(review.getTurf().getId())
                .bookingId(review.getBooking().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
