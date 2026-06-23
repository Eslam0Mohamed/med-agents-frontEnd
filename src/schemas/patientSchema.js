import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  nationalID: z
    .string()
    .min(1, 'National ID is required')
    .length(14, 'National ID must be exactly 14 digits')
    .regex(/^\d+$/, 'National ID must contain numbers only'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Please select a gender' }) }),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Please select a blood type' }),
  }),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
});
