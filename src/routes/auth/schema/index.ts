import { MaritalStatus, Role, ServiceEnum } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(1, "Phone number is required"),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  cinNumber: z.coerce.number().min(1, "CIN number is required"),
  cnssNumber: z.coerce.number().min(1, "CNSS number is required"),
  maritalStatus: z.nativeEnum(MaritalStatus).default(MaritalStatus.SINGLE),
  jobTitle: z.string().min(1, "Job title is required"),
  service: z.nativeEnum(ServiceEnum).default(ServiceEnum.ANESTHESIOLOGY),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  cinNumber: z.coerce.number().min(1, "CIN number is required"),
  cnssNumber: z.coerce.number().min(1, "CNSS number is required"),
  maritalStatus: z.nativeEnum(MaritalStatus).default(MaritalStatus.SINGLE),
  jobTitle: z.string().min(1, "Job title is required"),
  service: z.nativeEnum(ServiceEnum).default(ServiceEnum.ANESTHESIOLOGY),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
