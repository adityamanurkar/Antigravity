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
    public void run(String... args) throws Exception {
        System.out.println("DataInitializer: Running database consistency check...");
        
        // Automatically approve all pending turfs to make them visible to players
        turfRepository.findAll().stream()
                .filter(turf -> turf.getStatus() == TurfStatus.PENDING)
                .forEach(turf -> {
                    System.out.println("Approving turf: " + turf.getName());
                    turf.setStatus(TurfStatus.APPROVED);
                    turfRepository.save(turf);
                });
        
        System.out.println("DataInitializer: Database check complete.");
    }
}
