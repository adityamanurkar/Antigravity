package com.turfbooking.dto;

import com.turfbooking.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private String profilePicUrl;
    private Integer loyaltyPoints;
    private Boolean isActive;
}
