package com.kwgroup.sopdocument.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @InjectMocks
    private EmailService emailService;

    @Test
    void sendHtmlEmail_shouldSendEmail_viaSmtp() {
        // Arrange
        String to = "test@example.com";
        String subject = "Test Subject";
        String templateName = "test-template";
        Map<String, Object> variables = new HashMap<>();
        variables.put("key", "value");

        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "fromEmail", "admin@example.com");
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "emailEnabled", true);
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "mailProvider", "smtp");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html><body>Test</body></html>");

        // Act
        emailService.sendHtmlEmail(to, subject, templateName, variables);

        // Assert
        verify(mailSender).send(mimeMessage);
        verify(templateEngine).process(eq(templateName), any(Context.class));
    }

    @Test
    void sendHtmlEmail_shouldTrySendmail_whenProviderIsSendmail() {
        // Arrange
        String to = "test@example.com";
        String subject = "Test Subject";
        String templateName = "test-template";
        Map<String, Object> variables = new HashMap<>();
        variables.put("key", "value");

        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "fromEmail", "admin@example.com");
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "emailEnabled", true);
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "mailProvider", "sendmail");
        org.springframework.test.util.ReflectionTestUtils.setField(emailService, "sendmailPath", "dummy_sendmail");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html><body>Test</body></html>");

        // Act
        emailService.sendHtmlEmail(to, subject, templateName, variables);

        // Assert
        // Should NOT use mailSender.send()
        verify(mailSender, never()).send(mimeMessage);
        // Should still process template
        verify(templateEngine).process(eq(templateName), any(Context.class));
    }
}
