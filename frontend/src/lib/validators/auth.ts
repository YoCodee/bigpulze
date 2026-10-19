import { z } from 'zod';

export const registerSchema = z.object({
  org_name: z
    .string()
    .min(2, 'Nama usaha minimal 2 karakter')
    .max(120, 'Nama usaha maksimal 120 karakter')
    .trim(),
  full_name: z
    .string()
    .min(2, 'Nama pemilik wajib diisi minimal 2 karakter')
    .max(100, 'Nama pemilik maksimal 100 karakter')
    .trim(),
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
