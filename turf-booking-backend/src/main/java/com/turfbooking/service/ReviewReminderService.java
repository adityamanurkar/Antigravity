package com.turfbooking.service;

import com.turfbooking.entity.Booking;
import com.turfbooking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewReminderService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void sendReviewReminders() {
        log.info("Running Review Reminder Job...");
        
        // Find bookings that ended at least 2 hours ago today and have no reviews
        LocalTime timeThreshold = LocalTime.now().minusHours(2);
        
        List<Booking> unreviewedBookings = bookingRepository.findCompletedUnreviewedBookings(timeThreshold);
        
        for (Booking booking : unreviewedBookings) {
            log.info("Sending review reminder to user {} for booking {}", booking.getUser().getEmail(), booking.getId());
            notificationService.createNotification(
                    booking.getUser(),
                    "Rate Your Experience!",
                    "Hope you enjoyed your game at " + booking.getTurf().getName() + "! Please take a moment to leave a review and let others know how it was."
            );
        }
        
        log.info("Completed Review Reminder Job. Sent {} reminders.", unreviewedBookings.size());
    }
}
