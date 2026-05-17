package com.turfbooking.controller;

import com.turfbooking.dto.AuthRequest;
import com.turfbooking.dto.AuthResponse;
import com.turfbooking.dto.RegisterRequest;
import com.turfbooking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(jakarta.servlet.http.HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        return ResponseEntity.ok("Logged out successfully");
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<com.turfbooking.dto.UserDto> getMe(org.springframework.security.core.Authentication authentication) {
        com.turfbooking.security.UserDetailsImpl userDetails = (com.turfbooking.security.UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(authService.getProfile(userDetails.getId()));
    }
}
