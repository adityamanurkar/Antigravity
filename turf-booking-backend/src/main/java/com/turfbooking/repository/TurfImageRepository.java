package com.turfbooking.repository;

import com.turfbooking.entity.TurfImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TurfImageRepository extends JpaRepository<TurfImage, Long> {
}
