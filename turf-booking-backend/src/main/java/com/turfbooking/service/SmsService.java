package com.turfbooking.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    @PostConstruct
    public void init() {
        if (!"AC_DEFAULT".equals(accountSid)) {
            Twilio.init(accountSid, authToken);
            log.info("📱 Twilio SMS Service Initialized");
        }
    }

    @Async
    public void sendBookingSms(String toPhone, String userName, String turfName, String date, String time, String ref) {
        try {
            // Auto-format phone number if country code is missing (Assuming +91 for India as default)
            String formattedPhone = toPhone.startsWith("+") ? toPhone : "+91" + toPhone;

            if ("AC_DEFAULT".equals(accountSid)) {
                log.info("📱 SIMULATED SMS TO {}: Hi {}, booking for {} on {} @ {} confirmed! Ref: #{}", 
                    formattedPhone, userName, turfName, date, time, ref);
                return;
            }

            String body = String.format(
                "Hi %s, your booking at %s on %s at %s is CONFIRMED! Ref: #%s. Enjoy your match! - TurfMate",
                userName, turfName, date, time, ref
            );

            Message.creator(
                new PhoneNumber(formattedPhone),
                new PhoneNumber(twilioPhoneNumber),
                body
            ).create();
            
            log.info("✅ SMS SENT TO: {}", formattedPhone);
        } catch (Exception e) {
            log.error("❌ FAILED TO SEND SMS TO: {}", toPhone, e);
        }
    }

    @Async
    public void sendWelcomeSms(String toPhone, String userName) {
        try {
            String formattedPhone = toPhone.startsWith("+") ? toPhone : "+91" + toPhone;

            if ("AC_DEFAULT".equals(accountSid)) {
                log.info("📱 SIMULATED WELCOME SMS TO {}: Welcome to TurfMate, {}! Ready for your first match?", formattedPhone, userName);
                return;
            }

            String body = String.format("Welcome to TurfMate, %s! You're now part of the squad. Book your next match at http://localhost:5173", userName);

            Message.creator(
                new PhoneNumber(formattedPhone),
                new PhoneNumber(twilioPhoneNumber),
                body
            ).create();
            
            log.info("✅ WELCOME SMS SENT TO: {}", formattedPhone);
        } catch (Exception e) {
            log.error("❌ FAILED TO SEND WELCOME SMS", e);
        }
    }
}
