package com.turfbooking.repository;

import com.turfbooking.entity.Turf;
import com.turfbooking.entity.enums.TurfStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;

public interface TurfRepository extends JpaRepository<Turf, Long>, JpaSpecificationExecutor<Turf> {
    List<Turf> findByOwnerId(Long ownerId);

    @EntityGraph(attributePaths = {"images"})
    Page<Turf> findByStatus(TurfStatus status, Pageable pageable);
}
