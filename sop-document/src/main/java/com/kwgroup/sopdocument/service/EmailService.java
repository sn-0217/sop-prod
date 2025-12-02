package com.kwgroup.sopdocument.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

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
        if (!emailEnabled) {
            log.info("Email notifications are disabled. Skipping email to: {}", to);
            return;
        }
        log.info("Sending email to: {} using provider: {}", to, mailProvider);
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(templateName, context);

            helper.setFrom(fromEmail, "SOP Notification Service");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

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
