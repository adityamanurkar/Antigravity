package com.turfbooking.config;

import com.turfbooking.entity.enums.TurfStatus;
import com.turfbooking.repository.TurfRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TurfRepository turfRepository;

    @Override
    @Transactional
    public void run(String... args) {
        turfRepository.findAll().stream()
                .filter(turf -> turf.getStatus() == TurfStatus.PENDING)
                .forEach(turf -> {
                    turf.setStatus(TurfStatus.APPROVED);
                    turfRepository.save(turf);
                });
    }
}
