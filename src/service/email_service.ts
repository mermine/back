import { env } from "@/dotenv_config";
import nodemailer from "nodemailer";

export const CODE_EXPIRY_MINUTES = 10;

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log("✅ SMTP server is ready to send messages");
    } catch (error) {
      console.error("❌ SMTP configuration error:", error);
    }
  }

  private generateResetEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
        .code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px; letter-spacing: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header"><h2>Password Reset Request</h2></div>
    <p>Hello,</p>
    <p>You requested to reset your password. Use the verification code below to proceed:</p>
    <div class="code">${code}</div>
    <div class="warning"><strong>Important:</strong> This code will expire in ${CODE_EXPIRY_MINUTES} minutes. Do not share this code with anyone.</div>
    <p>If you didn't request this password reset, please ignore this email.</p>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} HrApp. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: env.SMTP_FROM_NAME,
          address: env.SMTP_FROM_EMAIL || env.SMTP_USER,
        },
        to: email,
        subject: "Your Password Reset Code - HrApp",
        html: this.generateResetEmailTemplate(code),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Password reset email sent to ${email}: ${info.messageId}`
      );
      return true;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return false;
    }
  }
}
