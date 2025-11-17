# SMTP Email Configuration Guide

This guide explains how to configure SMTP settings for sending user credentials via email.

## Environment Variables

Add the following environment variables to your `.env.local` or `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=System Admin
```

## Gmail Setup (Example)

If you're using Gmail, follow these steps:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS`

3. **Configuration Example for Gmail**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM_NAME=Your Company Name
   ```

## Other Email Providers

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

## Testing

After configuring the SMTP settings, test the email functionality by creating a new user. The system will automatically send an email with the user's credentials.

## Troubleshooting

- **Email not sending**: Check that all SMTP environment variables are set correctly
- **Authentication failed**: Verify your SMTP credentials (username and password)
- **Connection timeout**: Check your firewall settings and SMTP port
- **Gmail "Less secure app" error**: Use App Passwords instead of your regular password

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords for Gmail instead of your main password
- Consider using environment-specific configurations for development and production

