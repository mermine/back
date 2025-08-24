import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/prisma_client";
import { hashSync, compareSync } from "bcrypt";
import { env } from "@/dotenv_config";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyCodeSchema,
} from "./schema";
import { EmailService } from "@/service/email_service";
import {
  generateAuthToken,
  generatePasswordResetToken,
  generateResetCodeExpiry,
  generateSixDigitCode,
  ResponseTemplate,
  verifyPasswordResetToken,
} from "@/constants";

// Response templates

const emailService = new EmailService();

const app = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const existingUser = await db.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return c.json(ResponseTemplate.error("User already exists."), 400);
      }
      const newUser = await db.user.create({
        data: {
          ...data,
          password: hashSync(data.password, 10),
        },
      });
      const token = generateAuthToken(newUser.id, newUser.role);
      return c.json(
        ResponseTemplate.success("User registered successfully.", {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          token,
        }),
        201
      );
    } catch (error) {
      console.error("Registration error:", error);
      return c.json(
        ResponseTemplate.error("Registration failed. Please try again."),
        500
      );
    }
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return c.json(
          ResponseTemplate.error("Invalid email or password."),
          401
        );
      }
      const valid = compareSync(password, user.password);
      if (!valid) {
        return c.json(
          ResponseTemplate.error("Invalid email or password."),
          401
        );
      }
      const token = generateAuthToken(user.id, user.role);
      return c.json(
        ResponseTemplate.success("Login successful.", {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        })
      );
    } catch (error) {
      console.error("Login error:", error);
      return c.json(
        ResponseTemplate.error("Login failed. Please try again."),
        500
      );
    }
  })
  .post(
    "/forgot-password",
    zValidator("json", forgotPasswordSchema),
    async (c) => {
      try {
        const { email } = c.req.valid("json");
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          return c.json(
            ResponseTemplate.success(
              "If the email exists, a verification code has been sent."
            )
          );
        }
        const resetCode = generateSixDigitCode();
        const resetCodeExpiry = generateResetCodeExpiry();

        await db.user.update({
          where: { id: user.id },
          data: { resetToken: resetCode, resetTokenExpiry: resetCodeExpiry },
        });
        const emailSent = await emailService.sendPasswordResetEmail(
          email,
          resetCode
        );

        if (!emailSent && env.NODE_ENV === "production") {
          await db.user.update({
            where: { id: user.id },
            data: { resetToken: null, resetTokenExpiry: null },
          });
          return c.json(
            ResponseTemplate.error(
              "Failed to send verification email. Please try again."
            ),
            500
          );
        }

        return c.json(
          ResponseTemplate.success("Verification code sent successfully.")
        );
      } catch (error) {
        console.error("Forgot password error:", error);
        return c.json(
          ResponseTemplate.error(
            "Password reset request failed. Please try again."
          ),
          500
        );
      }
    }
  )
  .post(
    "/verify-reset-code",
    zValidator("json", verifyCodeSchema),
    async (c) => {
      try {
        const { email, code } = c.req.valid("json");
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          return c.json(ResponseTemplate.error("Invalid request."), 400);
        }

        if (
          !user.resetToken ||
          !user.resetTokenExpiry ||
          user.resetTokenExpiry < new Date()
        ) {
          return c.json(
            ResponseTemplate.error(
              "Verification code has expired. Please request a new one."
            ),
            400
          );
        }

        if (user.resetToken !== code) {
          return c.json(
            ResponseTemplate.error("Invalid verification code."),
            400
          );
        }

        const resetToken = generatePasswordResetToken(user.id);
        await db.user.update({
          where: { id: user.id },
          data: { resetToken: null, resetTokenExpiry: null },
        });

        return c.json(
          ResponseTemplate.success("Verification code accepted.", resetToken)
        );
      } catch (error) {
        console.error("Verify code error:", error);
        return c.json(
          ResponseTemplate.error("Verification failed. Please try again."),
          500
        );
      }
    }
  )
  .post(
    "/reset-password",
    zValidator("json", resetPasswordSchema),
    async (c) => {
      try {
        const { resetToken, newPassword } = c.req.valid("json");

        let decoded;
        try {
          decoded = verifyPasswordResetToken(resetToken);
        } catch (error) {
          return c.json(
            ResponseTemplate.error("Invalid or expired reset token."),
            400
          );
        }

        await db.user.update({
          where: { id: decoded.userId },
          data: { password: hashSync(newPassword, 10) },
        });

        return c.json(
          ResponseTemplate.success("Password has been reset successfully.")
        );
      } catch (error) {
        console.error("Reset password error:", error);
        return c.json(
          ResponseTemplate.error("Password reset failed. Please try again."),
          500
        );
      }
    }
  );

export default app;
