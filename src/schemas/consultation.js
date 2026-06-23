import { z } from 'zod';

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 6);

export const consultationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  rawInput: z.string().min(10, 'Notes must be at least 10 characters'),
  symptoms: z.string().min(1, 'Symptoms are required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  language: z.enum(['en', 'ar']),
  followUpDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const selected = new Date(val);
      return selected > today;
    }, 'Follow-up date cannot be today or in the past')
    .refine((val) => {
      if (!val) return true;
      const selected = new Date(val);
      return selected <= maxDate;
    }, 'Follow-up date cannot exceed 6 months from today'),
});