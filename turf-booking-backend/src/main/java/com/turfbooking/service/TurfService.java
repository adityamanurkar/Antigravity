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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurfService {

    private final TurfRepository turfRepository;
    private final UserRepository userRepository;
    private final com.turfbooking.repository.TimeSlotRepository timeSlotRepository;

    @Transactional(readOnly = true)
    public Page<TurfDto> getAllApprovedTurfs(Pageable pageable, String search, String city, String sport, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, List<String> amenities, java.time.LocalDate availableDate) {
        List<TurfDto> filteredTurfs = turfRepository.findByStatus(TurfStatus.APPROVED, Pageable.unpaged())
                .stream()
                .filter(turf -> matchesText(turf, search))
                .filter(turf -> matchesCity(turf, city))
                .filter(turf -> matchesSport(turf, sport))
                .filter(turf -> matchesPrice(turf, minPrice, maxPrice))
                .filter(turf -> matchesAmenities(turf, amenities))
                .filter(turf -> matchesAvailability(turf, availableDate))
                .map(this::mapToDto)
                .collect(Collectors.toList());

        int start = Math.min((int) pageable.getOffset(), filteredTurfs.size());
        int end = Math.min(start + pageable.getPageSize(), filteredTurfs.size());
        return new PageImpl<>(filteredTurfs.subList(start, end), pageable, filteredTurfs.size());
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
                .status(TurfStatus.APPROVED)
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

    @Transactional
    public TurfDto updateTurf(Long id, TurfCreateRequest request, Long ownerId) {
        Turf turf = turfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
        validateOwner(turf, ownerId);

        turf.setName(request.getName());
        turf.setDescription(request.getDescription());
        turf.setAddress(request.getAddress());
        turf.setCity(request.getCity());
        turf.setLatitude(request.getLatitude());
        turf.setLongitude(request.getLongitude());
        turf.setPricePerHour(request.getPricePerHour());
        turf.setSurfaceType(request.getSurfaceType());
        turf.setSportTypes(request.getSportTypes());
        turf.setAmenities(request.getAmenities());
        turf.setOpeningTime(request.getOpeningTime());
        turf.setClosingTime(request.getClosingTime());
        turf.setUpiId(request.getUpiId());

        List<TurfImage> images = new ArrayList<>();
        if (request.getImageUrls() != null) {
            images = request.getImageUrls().stream()
                    .map(url -> TurfImage.builder().turf(turf).imageUrl(url).isPrimary(false).build())
                    .collect(Collectors.toList());
            if (!images.isEmpty()) {
                images.get(0).setIsPrimary(true);
            }
        }
        if (turf.getImages() == null) {
            turf.setImages(new ArrayList<>());
        } else {
            turf.getImages().clear();
        }
        turf.getImages().addAll(images);

        return mapToDto(turfRepository.save(turf));
    }

    @Transactional
    public void deleteTurf(Long id, Long ownerId) {
        Turf turf = turfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));
        validateOwner(turf, ownerId);
        turfRepository.delete(turf);
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

    @Transactional(readOnly = true)
    public List<TurfDto> getAllTurfsForAdmin(TurfStatus status) {
        return turfRepository.findAll().stream()
                .filter(turf -> status == null || turf.getStatus() == status)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private boolean matchesText(Turf turf, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.toLowerCase(Locale.ROOT);
        return contains(turf.getName(), needle)
                || contains(turf.getCity(), needle)
                || contains(turf.getAddress(), needle)
                || contains(turf.getSurfaceType(), needle);
    }

    private boolean matchesCity(Turf turf, String city) {
        return city == null || city.isBlank() || contains(turf.getCity(), city.toLowerCase(Locale.ROOT));
    }

    private boolean matchesSport(Turf turf, String sport) {
        if (sport == null || sport.isBlank()) {
            return true;
        }
        String needle = sport.toLowerCase(Locale.ROOT);
        return turf.getSportTypes() != null && turf.getSportTypes().stream()
                .anyMatch(value -> value != null && value.toLowerCase(Locale.ROOT).contains(needle));
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private boolean matchesPrice(Turf turf, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        if (minPrice != null && turf.getPricePerHour().compareTo(minPrice) < 0) return false;
        if (maxPrice != null && turf.getPricePerHour().compareTo(maxPrice) > 0) return false;
        return true;
    }

    private boolean matchesAmenities(Turf turf, List<String> amenities) {
        if (amenities == null || amenities.isEmpty()) return true;
        if (turf.getAmenities() == null) return false;
        for (String amenity : amenities) {
            if (!turf.getAmenities().contains(amenity)) return false;
        }
        return true;
    }

    private boolean matchesAvailability(Turf turf, java.time.LocalDate availableDate) {
        if (availableDate == null) return true;
        return timeSlotRepository.existsByTurfIdAndSlotDateAndStatus(turf.getId(), availableDate, com.turfbooking.entity.enums.SlotStatus.AVAILABLE);
    }

    private void validateOwner(Turf turf, Long ownerId) {
        if (!turf.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("You are not allowed to manage this turf");
        }
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
                .averageRating(turf.getAverageRating() != null ? turf.getAverageRating() : 0.0)
                .reviewCount(turf.getReviewCount() != null ? turf.getReviewCount() : 0)
                .build();
    }
}
