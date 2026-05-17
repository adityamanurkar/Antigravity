package com.turfbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TurfCreateRequest {
    private String name;
    private String description;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private BigDecimal pricePerHour;
    private String surfaceType;
    private List<String> sportTypes;
    private List<String> amenities;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private List<String> imageUrls;
}
