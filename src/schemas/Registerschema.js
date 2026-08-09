import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),
    specialty: z.string().optional(),
    // نفس القاعدة بالظبط المطبقة في الباك اند (auth.controller.js) - طول 8
    // أحرف على الأقل + حرف واحد ورقم واحد على الأقل، عشان الدكتور يشوف
    // رسالة الخطأ فورًا في الفرونت من غير ما يستنى رد السيرفر
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });