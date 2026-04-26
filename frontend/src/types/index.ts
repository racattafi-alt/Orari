export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type ShiftType =
  | 'NORMAL' | 'OVERTIME' | 'HOLIDAY_WORK' | 'ON_CALL'
  | 'TRAINING' | 'DAY_OFF' | 'SICK' | 'VACATION' | 'PERMIT';

export type HolidayType = 'NATIONAL' | 'REGIONAL' | 'LOCAL' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  storeId: string;
  storeName?: string;
  canClockIn: boolean;
  avatarUrl?: string;
  phone?: string;
  store?: Store;
}

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  iban?: string;
  fiscalCode?: string;
  hireDate?: string;
  weeklyHours: number;
  isActive: boolean;
  canClockIn: boolean;
  geoLatitude?: number;
  geoLongitude?: number;
  geoRadiusMeters?: number;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  province: string;
  region: string;
  timezone: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  storeId: string;
  year: number;
  month: number;
  name?: string;
  notes?: string;
  isPublished: boolean;
  publishedAt?: string;
  entries: ScheduleEntry[];
}

export interface ScheduleEntry {
  id: string;
  scheduleId: string;
  userId: string;
  user?: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes?: string;
  shiftType: ShiftType;
  shiftId?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: string;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  user?: Pick<Employee, 'id' | 'firstName' | 'lastName'>;
  date: string;
  clockIn?: string;
  clockOut?: string;
  clockInLat?: number;
  clockInLon?: number;
  clockOutLat?: number;
  clockOutLon?: number;
  clockInValid: boolean;
  clockOutValid: boolean;
  workedMinutes?: number;
  notes?: string;
  isManual: boolean;
}

export interface Holiday {
  date: string;
  name: string;
  type: HolidayType;
}

export interface StoreStats {
  totalEmployees: number;
  activeEmployees: number;
  totalMonthHours: number;
  totalYearHours: number;
  avgHoursPerEmployee: number;
  byEmployee: Record<string, { workedMinutes: number; daysWorked: number }>;
  monthlyTrend: { month: string; hours: number }[];
  shiftDistribution: Record<string, number>;
}

export interface EmployeeStats {
  user: { firstName: string; lastName: string; weeklyHours: number };
  year: number;
  totalWorkedHours: number;
  totalDaysWorked: number;
  monthlyData: { month: string; workedHours: number; scheduledHours: number; daysWorked: number }[];
  shiftTypes: Record<string, number>;
  averageHoursPerDay: number;
}
