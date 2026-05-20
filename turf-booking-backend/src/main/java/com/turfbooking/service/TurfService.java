package com.turfbooking.service;

import com.turfbooking.dto.TurfCreateRequest;
import com.turfbooking.dto.TurfDto;
import com.turfbooking.entity.Turf;
import com.turfbooking.entity.TurfImage;
import com.turfbooking.entity.User;
import com.turfbooking.entity.enums.TurfStatus;
import com.turfbooking.exception.ResourceNotFoundException;
import com.turfbooking.repository.TurfRepository;
import com.turfbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurfService {

    private final TurfRepository turfRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TurfDto> getAllApprovedTurfs(Pageable pageable) {
        return turfRepository.findByStatus(TurfStatus.APPROVED, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public TurfDto getTurfById(Long id) {
        return turfRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
    }

    @Transactional
    public TurfDto createTurf(TurfCreateRequest request, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        Turf turf = Turf.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .pricePerHour(request.getPricePerHour())
                .surfaceType(request.getSurfaceType())
                .sportTypes(request.getSportTypes())
                .amenities(request.getAmenities())
                .openingTime(request.getOpeningTime())
                .closingTime(request.getClosingTime())
                .upiId(request.getUpiId())
                .status(TurfStatus.PENDING)
                .build();

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<TurfImage> images = request.getImageUrls().stream()
                    .map(url -> TurfImage.builder().turf(turf).imageUrl(url).isPrimary(false).build())
                    .collect(Collectors.toList());
            images.get(0).setIsPrimary(true);
            turf.setImages(images);
        }

        return mapToDto(turfRepository.save(turf));
    }

    @Transactional(readOnly = true)
    public List<TurfDto> getTurfsByOwner(Long ownerId) {
        return turfRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TurfDto updateTurfStatus(Long id, TurfStatus status) {
        Turf turf = turfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
        turf.setStatus(status);
        return mapToDto(turfRepository.save(turf));
    }

    private TurfDto mapToDto(Turf turf) {
        List<String> images = turf.getImages() != null ? turf.getImages().stream().map(TurfImage::getImageUrl).collect(Collectors.toList()) : List.of();
        return TurfDto.builder()
                .id(turf.getId())
                .ownerId(turf.getOwner().getId())
                .name(turf.getName())
                .description(turf.getDescription())
                .address(turf.getAddress())
                .city(turf.getCity())
                .latitude(turf.getLatitude())
                .longitude(turf.getLongitude())
                .pricePerHour(turf.getPricePerHour())
                .surfaceType(turf.getSurfaceType())
                .sportTypes(turf.getSportTypes())
                .amenities(turf.getAmenities())
                .openingTime(turf.getOpeningTime())
                .closingTime(turf.getClosingTime())
                .status(turf.getStatus())
                .upiId(turf.getUpiId())
                .images(images)
                .build();
    }
}
