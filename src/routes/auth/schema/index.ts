import { MaritalStatus, Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(1, "Phone number is required"),
  role: z.nativeEnum(Role).default(Role.EMPOYEE),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  cinNumber: z.coerce.number().min(1, "CIN number is required"),
  cnssNumber: z.coerce.number().min(1, "CNSS number is required"),
  maritalStatus: z.nativeEnum(MaritalStatus).default(MaritalStatus.SINGLE),
  jobTitle: z.string().min(1, "Job title is required"),
  service: z.string().min(1, "Service is required"),
});
