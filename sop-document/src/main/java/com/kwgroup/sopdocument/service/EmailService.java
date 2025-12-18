package com.kwgroup.sopdocument.service;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${sop.notification.enabled:true}")
    private boolean emailEnabled;

    @Value("${sop.mail.provider:smtp}")
    private String mailProvider;

    @Value("${sop.mail.sendmail.path:/usr/sbin/sendmail}")
    private String sendmailPath;

    @Async
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        sendHtmlEmail(to, subject, templateName, variables, null);
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables,
            String cc) {
        if (!emailEnabled) {
            log.info("Email notifications are disabled. Skipping email to: {}", to);
            return;
        }

        log.info("Sending email to: {} using provider: {}", to, mailProvider);
        if (cc != null && !cc.isBlank()) {
            log.info("CC: {}", cc);
        }

        try {
            // Validate provider configuration
            if ("smtp".equalsIgnoreCase(mailProvider) && mailSender == null) {
                log.error(
                        "SMTP provider selected but JavaMailSender is not configured. Please check your mail configuration.");
                return;
            }

            // Create MimeMessage based on provider
            MimeMessage mimeMessage;
            if ("sendmail".equalsIgnoreCase(mailProvider)) {
                // For sendmail, create a Session-less MimeMessage
                mimeMessage = new MimeMessage((Session) null);
            } else {
                // For SMTP, use JavaMailSender to create MimeMessage
                mimeMessage = mailSender.createMimeMessage();
            }

            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(templateName, context);

            helper.setFrom(fromEmail, "SOP Notification Service");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            // Add CC if provided
            if (cc != null && !cc.isBlank()) {
                helper.setCc(cc);
            }

            if ("sendmail".equalsIgnoreCase(mailProvider)) {
                sendWithSendmail(mimeMessage, to);
            } else {
                mailSender.send(mimeMessage);
            }
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException | IOException | InterruptedException e) {
            log.error("Failed to send email to: {}", to, e);
        }
    }

    private void sendWithSendmail(MimeMessage mimeMessage, String to)
            throws IOException, InterruptedException, MessagingException {
        ProcessBuilder processBuilder = new ProcessBuilder(sendmailPath, "-t", "-i");
        Process process = processBuilder.start();

        try (OutputStream outputStream = process.getOutputStream()) {
            mimeMessage.writeTo(outputStream);
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("Sendmail process exited with error code: " + exitCode);
        }
    }
}
