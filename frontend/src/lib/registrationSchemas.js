import { z } from 'zod';

// zod schemas for the admin registration forms (shop owner + shop). Mirrors the
// Java DTO constraints (CreateOwnerRequest / CreateShopRequest) so the client
// catches the same problems the backend would, before the round-trip.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian mobile number: 10 digits starting 6–9, optionally with a +91 / 91 / 0
// prefix. Spaces and dashes are ignored, so "+91 98765 43210" and "9876543210"
// both pass. (India-only for now — widen this if we expand to other countries.)
const INDIAN_PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;
const isIndianMobile = (v) => INDIAN_PHONE_RE.test(v.replace(/[\s-]/g, ''));

// Optional free-text: blank is fine, but if the user typed something it must pass.
const optionalPhone = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || isIndianMobile(v),
    'Enter a valid 10-digit Indian mobile number',
  );

export const ownerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL_RE, 'Enter a valid email'),
  phone: optionalPhone,
  password: z.string().min(6, 'At least 6 characters'),
});

export const shopSchema = z.object({
  name: z.string().trim().min(2, 'Shop name is required'),
  // Physical chair count — required, whole number ≥ 1 (mirrors CreateShopRequest's
  // @NotNull @Positive). Caps the shop's effective chair count for wait-time math.
  maxChairs: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 1, 'Enter a whole number of chairs (1 or more)'),
  whatsappNumber: optionalPhone,
  phone: optionalPhone,
  address: z.string().trim().max(500, 'Too long').optional().or(z.literal('')),
  locationUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\/.+/i.test(v), 'Paste a full link starting with http'),
  openingTime: z.string(),
  closingTime: z.string(),
});

// Staff sign in with this exact phone + PIN (see BarberLoginScreen's phoneSchema),
// so — unlike whatsappNumber/phone above — no +91 prefix is accepted here: what's
// typed at registration must be byte-for-byte what's typed at login.
export const staffSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a 10-digit phone number'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
});
