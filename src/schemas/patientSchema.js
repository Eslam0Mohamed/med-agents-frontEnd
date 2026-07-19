import { z } from "zod";

export const patientSchema = z.object({
  name: z
    .string()
    .min(1, "patients.validation.nameRequired")
    .regex(/^[\u0621-\u064A\s]+$/, "patients.validation.nameArabicOnly"),
  phone: z
    .string()
    .min(1, "patients.validation.phoneRequired")
    .regex(/^01[0125][0-9]{8}$/, "patients.validation.phoneInvalid"),
  dateOfBirth: z
    .string()
    .min(1, "patients.validation.dobRequired")
    .refine((value) => {
      const entered = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return entered <= today;
    }, "patients.validation.dobFuture"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "patients.validation.genderRequired" }),
  }),
  // بنقبل string فاضية أو undefined أو null وبنحولهم لـ undefined قبل ما يوصلوا
  // للـ API — عشان الـ backend بيرفض empty string في الـ bloodType enum
  bloodType: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" || val == null ? undefined : val))
    .pipe(
      z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
    ),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
  chronicMedications: z.array(z.string()).optional().default([]),
});
