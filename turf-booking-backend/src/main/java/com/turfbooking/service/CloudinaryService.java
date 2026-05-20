package com.turfbooking.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Uploads a file to Cloudinary and returns the secure HTTPS URL.
     * Images are stored in the "turfiez" folder on Cloudinary.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "turfiez",
                "resource_type", "auto"
        ));
        return (String) uploadResult.get("secure_url");
    }
}
