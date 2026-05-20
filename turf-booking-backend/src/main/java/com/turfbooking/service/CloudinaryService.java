package com.turfbooking.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private static final Path LOCAL_UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    /**
     * Uploads a file to Cloudinary when configured, otherwise stores it locally
     * through the legacy /api/uploads endpoint.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        if (!isCloudinaryConfigured()) {
            return saveLocally(file);
        }

        try {
            return uploadToCloudinary(file);
        } catch (Exception e) {
            return saveLocally(file);
        }
    }

    private String uploadToCloudinary(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "turfiez",
                "resource_type", "auto"
        ));
        return (String) uploadResult.get("secure_url");
    }

    private String saveLocally(MultipartFile file) throws IOException {
        Files.createDirectories(LOCAL_UPLOAD_DIR);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
        String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String filename = UUID.randomUUID() + "_" + safeFilename;

        Path target = LOCAL_UPLOAD_DIR.resolve(filename).normalize();
        if (!target.startsWith(LOCAL_UPLOAD_DIR)) {
            throw new IOException("Invalid upload path");
        }

        file.transferTo(target);
        return "/api/uploads/" + filename;
    }

    private boolean isCloudinaryConfigured() {
        return isConfiguredValue(cloudName, "your-cloud-name")
                && isConfiguredValue(apiKey, "your-api-key")
                && isConfiguredValue(apiSecret, "your-api-secret");
    }

    private boolean isConfiguredValue(String value, String placeholder) {
        return value != null && !value.isBlank() && !placeholder.equals(value);
    }
}
