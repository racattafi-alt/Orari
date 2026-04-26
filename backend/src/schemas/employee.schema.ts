import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  phone: z.string().optional(),
  iban: z.string().optional(),
  fiscalCode: z.string().optional(),
  hireDate: z.string().datetime().optional(),
  weeklyHours: z.number().min(1).max(60).default(40),
  canClockIn: z.boolean().default(false),
  geoLatitude: z.number().optional(),
  geoLongitude: z.number().optional(),
  geoRadiusMeters: z.number().optional(),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ email: true, password: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const employeeIdSchema = z.object({ id: z.string() });
