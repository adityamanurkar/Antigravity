package com.turfbooking.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendBookingConfirmation(String toEmail, String userName, String turfName, String date, String time, String ref) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(toEmail);
            helper.setSubject("Booking Confirmed! ⚽ " + turfName);
            
            String htmlContent = String.format(
                "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #C5F135; border-radius: 10px;'>" +
                "<h1 style='color: #032b21;'>Booking Confirmed!</h1>" +
                "<p>Hi <strong>%s</strong>,</p>" +
                "<p>Your session at <strong>%s</strong> is reserved.</p>" +
                "<div style='background: #f4f4f4; padding: 15px; border-radius: 5px;'>" +
                "<p>📅 <strong>Date:</strong> %s</p>" +
                "<p>⏰ <strong>Time:</strong> %s</p>" +
                "<p>🆔 <strong>Ref:</strong> #%s</p>" +
                "</div>" +
                "<p style='margin-top: 20px;'>See you on the field!</p>" +
                "<p style='color: #888;'>Team TurfMate</p>" +
                "</div>",
                userName, turfName, date, time, ref
            );
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("✅ REAL EMAIL SENT TO: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ FAILED TO SEND EMAIL TO: {}", toEmail, e);
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(toEmail);
            helper.setSubject("Welcome to the Squad! 🏟️ TurfMate");
            
            String htmlContent = String.format(
                "<div style='font-family: Arial, sans-serif; padding: 20px; text-align: center;'>" +
                "<h1 style='color: #C5F135; background: #032b21; padding: 20px; border-radius: 10px;'>TURFMATE</h1>" +
                "<h2>Welcome to the team, %s!</h2>" +
                "<p>You are now part of the world's premier turf booking community.</p>" +
                "<p>Ready for your first match?</p>" +
                "<a href='http://localhost:5173/turfs' style='background: #C5F135; color: #032b21; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>BROWSE TURFS</a>" +
                "</div>",
                userName
            );
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("✅ REAL WELCOME EMAIL SENT TO: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ FAILED TO SEND WELCOME EMAIL", e);
        }
    }
}
