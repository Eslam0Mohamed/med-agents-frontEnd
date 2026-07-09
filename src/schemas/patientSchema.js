import { z } from "zod";

export const patientSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required")
      .regex(
        /^[\u0621-\u064A\s]+$/,
        "Name must be written in Arabic letters only",
      ),
    nationalID: z
      .string()
      .min(1, "National ID is required")
      .length(14, "National ID must be exactly 14 digits")
      .regex(/^\d+$/, "National ID must contain numbers only")
      .refine((val) => {
        const century = val[0];
        return century === "2" || century === "3";
      }, "Invalid National ID: first digit must be 2 or 3")
      .refine((val) => {
        const month = parseInt(val.slice(3, 5), 10);
        return month >= 1 && month <= 12;
      }, "Invalid National ID: birth month is invalid")
      .refine((val) => {
        const day = parseInt(val.slice(5, 7), 10);
        return day >= 1 && day <= 31;
      }, "Invalid National ID: birth day is invalid")
      .refine((val) => {
        const governorateCode = parseInt(val.slice(7, 9), 10);
        return (
          (governorateCode >= 1 && governorateCode <= 35) ||
          governorateCode === 88
        );
      }, "Invalid National ID: governorate code is invalid"),
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
  })
  .superRefine((data, ctx) => {
    const { nationalID, dateOfBirth } = data;
    if (!nationalID || nationalID.length !== 14 || !/^\d+$/.test(nationalID))
      return;
    if (!dateOfBirth) return;

    const century = nationalID[0];
    const centuryBase = century === "2" ? 1900 : century === "3" ? 2000 : null;
    if (!centuryBase) return;

    const yearFromId = centuryBase + parseInt(nationalID.slice(1, 3), 10);
    const monthFromId = parseInt(nationalID.slice(3, 5), 10);
    const dayFromId = parseInt(nationalID.slice(5, 7), 10);

    const [yearEntered, monthEntered, dayEntered] = dateOfBirth
      .split("-")
      .map((part) => parseInt(part, 10));

    if (!yearEntered || !monthEntered || !dayEntered) return;

    if (
      yearFromId !== yearEntered ||
      monthFromId !== monthEntered ||
      dayFromId !== dayEntered
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nationalID"],
        message: `The birth date in the National ID (${monthFromId}/${dayFromId}/${yearFromId}) does not match the entered Date of Birth`,
      });
    }
  });
