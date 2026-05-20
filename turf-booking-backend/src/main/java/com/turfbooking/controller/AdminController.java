package com.turfbooking.controller;

import com.turfbooking.dto.TurfDto;
import com.turfbooking.dto.UserDto;
import com.turfbooking.entity.User;
import com.turfbooking.entity.enums.TurfStatus;
import com.turfbooking.repository.UserRepository;
import com.turfbooking.service.TurfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final TurfService turfService;
    private final UserRepository userRepository;

    @GetMapping("/turfs")
    public ResponseEntity<List<TurfDto>> getTurfs(@RequestParam(required = false) TurfStatus status) {
        return ResponseEntity.ok(turfService.getAllTurfsForAdmin(status));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(this::mapToDto).toList());
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .profilePicUrl(user.getProfilePicUrl())
                .loyaltyPoints(user.getLoyaltyPoints())
                .build();
    }
}
