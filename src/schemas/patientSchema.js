import { z } from "zod";

export const patientSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .regex(
      /^[\u0621-\u064A\s]+$/,
      "Name must be written in Arabic letters only",
    ),
  // رقم موبايل مصري: 01 + (0 أو 1 أو 2 أو 5) + 8 أرقام = 11 رقم بالظبط
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^01[0125][0-9]{8}$/,
      "Enter a valid Egyptian mobile number (e.g. 010/011/012/015XXXXXXXX)",
    ),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    errorMap: () => ({ message: "Please select a blood type" }),
  }),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
  chronicMedications: z.array(z.string()).optional().default([]),
});
