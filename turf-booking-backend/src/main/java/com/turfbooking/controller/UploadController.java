package com.turfbooking.controller;

import com.turfbooking.service.CloudinaryService;
import com.turfbooking.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    private static final Path LEGACY_UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    @PreAuthorize("hasRole('OWNER')")
    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            validateImage(file);
            String fileUrl = cloudinaryService.uploadFile(file);

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<byte[]> getLegacyFile(@PathVariable String filename) {
        try {
            Path filePath = LEGACY_UPLOAD_DIR.resolve(filename).normalize();
            if (!filePath.startsWith(LEGACY_UPLOAD_DIR) || !Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "image/jpeg")
                    .body(Files.readAllBytes(filePath));
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Image file must be 10MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image uploads are allowed");
        }
    }
}
