import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function calcShiftMinutes(startTime: string, endTime: string, breakMinutes = 0): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm) - breakMinutes;
  return Math.max(0, total);
}

export const SHIFT_TYPE_LABELS: Record<string, string> = {
  NORMAL: 'Normale', OVERTIME: 'Straordinario', HOLIDAY_WORK: 'Festivo',
  ON_CALL: 'Reperibilità', TRAINING: 'Formazione', DAY_OFF: 'Riposo',
  SICK: 'Malattia', VACATION: 'Ferie', PERMIT: 'Permesso',
};

export const SHIFT_TYPE_COLORS: Record<string, string> = {
  NORMAL: 'bg-blue-100 text-blue-800',
  OVERTIME: 'bg-orange-100 text-orange-800',
  HOLIDAY_WORK: 'bg-red-100 text-red-800',
  ON_CALL: 'bg-yellow-100 text-yellow-800',
  TRAINING: 'bg-purple-100 text-purple-800',
  DAY_OFF: 'bg-gray-100 text-gray-800',
  SICK: 'bg-pink-100 text-pink-800',
  VACATION: 'bg-green-100 text-green-800',
  PERMIT: 'bg-teal-100 text-teal-800',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Dipendente',
};
