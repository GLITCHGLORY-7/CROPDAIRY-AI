import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  preferredLanguage: z.enum(['en', 'ta', 'hi']).default('en'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const onboardingSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  preferredLanguage: z.enum(['en', 'ta', 'hi']),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(2, 'State / Province is required'),
  district: z.string().min(2, 'District / Locality is required'),
  preferredAreaUnit: z.enum(['Acres', 'Hectares', 'Bigha', 'Guntha']),
  farmingExperience: z.string().optional(),
  primaryFarmingType: z.enum([
    'Open field',
    'Orchard',
    'Greenhouse',
    'Kitchen garden',
    'Mixed farming',
    'Other'
  ]).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
