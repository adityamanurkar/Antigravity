package com.turfbooking.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.turfbooking.entity.Booking;
import com.turfbooking.entity.enums.PaymentStatus;
import com.turfbooking.exception.ResourceNotFoundException;
import com.turfbooking.repository.BookingRepository;
import com.turfbooking.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final BookingRepository bookingRepository;

    @Value("${razorpay.key.id:rzp_test_YourTestKeyId}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:your_test_key_secret}")
    private String razorpayKeySecret;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, Object> data,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long bookingId = Long.parseLong(data.get("bookingId").toString());
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

            if (!booking.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(403).build();
            }
            if ("your_test_key_secret".equals(razorpayKeySecret) || "rzp_test_YourTestKeyId".equals(razorpayKeyId)) {
                // MOCK MODE
                Map<String, Object> response = new HashMap<>();
                response.put("orderId", "order_mock_" + booking.getId());
                response.put("amount", booking.getTotalPrice().multiply(java.math.BigDecimal.valueOf(100)).intValue());
                response.put("currency", "INR");
                response.put("key", "rzp_test_YourTestKeyId");
                return ResponseEntity.ok(response);
            }

            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            // Amount is in paise (₹1 = 100 paise)
            orderRequest.put("amount", booking.getTotalPrice().multiply(java.math.BigDecimal.valueOf(100)).intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + booking.getId());

            Order order = razorpay.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("key", razorpayKeyId);

            return ResponseEntity.ok(response);

        } catch (RazorpayException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(
            @RequestBody Map<String, String> data,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        String razorpayOrderId = data.get("razorpay_order_id");
        String razorpayPaymentId = data.get("razorpay_payment_id");
        String razorpaySignature = data.get("razorpay_signature");
        Long bookingId = Long.parseLong(data.get("bookingId"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).build();
        }

        try {
            if ("your_test_key_secret".equals(razorpayKeySecret) || "rzp_test_YourTestKeyId".equals(razorpayKeyId)) {
                booking.setPaymentStatus(PaymentStatus.PAID);
                bookingRepository.save(booking);

                Map<String, String> response = new HashMap<>();
                response.put("status", "success");
                return ResponseEntity.ok(response);
            }

            // Verify signature
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256"));
            byte[] macBytes = mac.doFinal(payload.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : macBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String generatedSignature = hexString.toString();

            if (generatedSignature.equals(razorpaySignature)) {
                booking.setPaymentStatus(PaymentStatus.PAID);
                bookingRepository.save(booking);

                Map<String, String> response = new HashMap<>();
                response.put("status", "success");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid signature"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
