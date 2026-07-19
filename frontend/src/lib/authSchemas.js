import { z } from 'zod';

// zod validation schemas for the login form, one per auth method.
// Regex-based (rather than z.email()) so the messages stay explicit and the
// code is version-stable across zod releases.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(EMAIL_RE, 'Enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'At least 6 characters'),
});

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10}$/, 'Enter a 10-digit number'),
  pin: z
    .string()
    .min(1, 'PIN is required')
    .regex(/^\d{4}$/, 'PIN must be 4 digits'),
});

export function schemaForAuthMethod(authMethod) {
  return authMethod === 'phone' ? phoneSchema : emailSchema;
}

// Runs safeParse and flattens issues into a { fieldName: firstMessage } map.
// Returns {} when valid.
export function validateWithSchema(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
