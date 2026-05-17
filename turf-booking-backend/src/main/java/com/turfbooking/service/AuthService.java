package com.turfbooking.service;

import com.turfbooking.dto.AuthRequest;
import com.turfbooking.dto.AuthResponse;
import com.turfbooking.dto.RegisterRequest;
import com.turfbooking.dto.UserDto;
import com.turfbooking.entity.User;
import com.turfbooking.exception.BadRequestException;
import com.turfbooking.repository.UserRepository;
import com.turfbooking.security.JwtUtil;
import com.turfbooking.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final com.turfbooking.security.TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final SmsService smsService;

    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        
        // Trigger simulated email
        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
        
        // Trigger real-time SMS
        if (savedUser.getPhone() != null && !savedUser.getPhone().isEmpty()) {
            try {
                smsService.sendWelcomeSms(savedUser.getPhone(), savedUser.getName());
            } catch (Exception e) {
                System.err.println("Failed to send welcome SMS: " + e.getMessage());
            }
        }
        
        UserDetailsImpl userDetails = new UserDetailsImpl(savedUser);
        String jwtToken = jwtUtil.generateToken(userDetails);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(savedUser))
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtUtil.generateToken(userDetails);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .build();
    }

    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.turfbooking.exception.ResourceNotFoundException("User not found"));
        return mapToDto(user);
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
