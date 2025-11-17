import nodemailer from 'nodemailer';

// Email configuration from environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email template for user credentials
export const getUserCredentialsEmailTemplate = (
  name: string,
  username: string,
  password: string,
//   email: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account Credentials</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .email-header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 5px;
            margin: 25px 0;
        }
        .credential-item {
            margin-bottom: 15px;
        }
        .credential-item:last-child {
            margin-bottom: 0;
        }
        .credential-label {
            font-size: 14px;
            color: #888888;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 18px;
            color: #333333;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 25px 0;
        }
        .warning-box p {
            font-size: 14px;
            color: #856404;
            margin: 0;
            line-height: 1.5;
        }
        .warning-icon {
            display: inline-block;
            margin-right: 8px;
            font-size: 16px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            font-size: 14px;
            color: #888888;
            margin: 5px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .email-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Welcome to Our System</h1>
            <p>Your account has been created successfully</p>
        </div>
        <div class="email-body">
            <div class="greeting">
                Hello ${name},
            </div>
            <div class="message">
                Your account has been successfully created. Please find your login credentials below. 
                Please keep this information secure and do not share it with anyone.
            </div>
            
            <div class="credentials-box">
                <div class="credential-item">
                    <div class="credential-label">Username</div>
                    <div class="credential-value">${username}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Password</div>
                    <div class="credential-value">${password}</div>
                </div>
            </div>

            <div class="warning-box">
                <p>
                    <span class="warning-icon">⚠️</span>
                    <strong>Important:</strong> For security reasons, please change your password after your first login.
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="#" class="button">Login to Your Account</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #aaaaaa;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

// Function to send user credentials email
export const sendUserCredentialsEmail = async (
  to: string,
  name: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate email configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is missing');
      return {
        success: false,
        error: 'Email service is not configured. Please contact administrator.',
      };
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'System Admin'}" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Your Account Credentials - Welcome!',
      html: getUserCredentialsEmailTemplate(name, username, password),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
};

