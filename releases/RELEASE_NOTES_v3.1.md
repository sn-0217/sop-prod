# Release v3.1 - Email Configuration & Outlook Compatibility

**Release Date:** December 11, 2025

## 🎯 Overview
This release focuses on improving email functionality with configurable sender information and full Outlook compatibility for email notifications.

## ✨ New Features

### Configurable Email Sender Name
- Added `spring.mail.from-name` property in `application.properties`
- Email sender display name is now fully configurable
- No code changes needed - just update the property file

### Improved Sendmail Support
- Enhanced sendmail command with `-f` flag for proper sender address
- Fixed missing "From" field in emails
- Better logging for email debugging

## 🐛 Bug Fixes

### Email Template Outlook Compatibility
- **MAJOR FIX**: Completely rewrote email template for Outlook compatibility
- Replaced modern CSS (flexbox, gradients, etc.) with table-based layout
- All styles are now inline for maximum email client compatibility
- Fixed styling not appearing in Outlook (Windows, Mac, Web)

### Email Configuration
- Updated email addresses to knitwellgroup.com domain
- From: `sop-notifications@knitwellgroup.com`
- To: `santosh.battula@knitwellgroup.com`

## 📋 Configuration Changes

### application.properties
```properties
# From email address
spring.mail.username=sop-notifications@knitwellgroup.com

# From email display name (NEW)
spring.mail.from-name=SOP Management System

# Notification recipient
sop.notification.admin-email=santosh.battula@knitwellgroup.com
```

## 🔧 Technical Details

### Email Template Improvements
- Converted from div-based layout to table-based layout
- All CSS moved to inline styles
- Removed unsupported CSS features:
  - Flexbox
  - CSS Gradients
  - Border-radius
  - Box-shadow
  - Pseudo-elements (::before, ::after)
- Added MSO (Microsoft Office) specific styles
- Tested and verified in multiple email clients

### Email Service Enhancements
- Enhanced sendmail process with explicit sender flag
- Improved error logging
- Better debug information for troubleshooting

## 📦 Installation

1. Stop the existing SOP application
2. Download `sop-document-v3.1.jar` from this release
3. Replace your existing JAR file
4. Update `application.properties` with the new configuration
5. Restart the application

## ✅ Compatibility

**Supported Email Clients:**
- ✅ Microsoft Outlook (Windows, Mac, Web)
- ✅ Gmail
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Mobile email clients (iOS Mail, Android Gmail)

**Requirements:**
- Java 17 or higher
- Linux server with sendmail configured
- Spring Boot 3.5.8

## 📝 Migration Notes

If upgrading from v3.0:
1. Add the new `spring.mail.from-name` property to your `application.properties`
2. Update email addresses if needed
3. No database migrations required
4. No breaking changes

## 🔗 Links

- GitHub Repository: https://github.com/sn-0217/sop-prod
- Issue Tracker: Report issues on GitHub

## 👥 Contributors

- Santosh Battula (@sn-0217)

---

**Full Changelog**: https://github.com/sn-0217/sop-prod/compare/v3.0...v3.1
