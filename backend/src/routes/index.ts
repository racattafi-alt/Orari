import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import * as authCtrl from '../controllers/auth.controller';
import * as empCtrl from '../controllers/employee.controller';
import * as schedCtrl from '../controllers/schedule.controller';
import * as attCtrl from '../controllers/attendance.controller';
import * as holidayCtrl from '../controllers/holiday.controller';
import * as statsCtrl from '../controllers/stats.controller';
import * as exportCtrl from '../controllers/export.controller';
import * as storeCtrl from '../controllers/store.controller';

const router = Router();

// Auth
router.post('/auth/login', authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.me);
router.put('/auth/password', authenticate, authCtrl.changePassword);

// Employees
router.get('/employees', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), empCtrl.list);
router.get('/employees/:id', authenticate, empCtrl.get);
router.post('/employees', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), empCtrl.create);
router.put('/employees/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), empCtrl.update);
router.delete('/employees/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), empCtrl.remove);
router.post('/employees/:id/reset-password', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), empCtrl.resetPassword);

// Schedule
router.get('/schedule', authenticate, schedCtrl.getOrCreate);
router.get('/schedule/my', authenticate, schedCtrl.getMySchedule);
router.post('/schedule/:scheduleId/entries', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), schedCtrl.upsertEntry);
router.post('/schedule/:scheduleId/entries/bulk', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), schedCtrl.bulkUpsert);
router.delete('/schedule/entries/:entryId', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), schedCtrl.deleteEntry);
router.post('/schedule/:scheduleId/publish', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), schedCtrl.publish);

// Shifts (templates)
router.get('/shifts', authenticate, schedCtrl.listShifts);
router.post('/shifts', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), schedCtrl.createShift);
router.delete('/shifts/:shiftId', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), schedCtrl.deleteShift);

// Attendance / Timbratura
router.post('/attendance/clock-in', authenticate, attCtrl.clockIn);
router.post('/attendance/clock-out', authenticate, attCtrl.clockOut);
router.get('/attendance/today', authenticate, attCtrl.todayStatus);
router.get('/attendance', authenticate, attCtrl.list);
router.post('/attendance/manual', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), attCtrl.createManual);

// Holidays
router.get('/holidays', authenticate, holidayCtrl.list);
router.post('/holidays/refresh', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), holidayCtrl.refresh);
router.post('/holidays/custom', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), holidayCtrl.addCustom);
router.delete('/holidays/custom/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), holidayCtrl.removeCustom);

// Stats
router.get('/stats/store', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), statsCtrl.storeStats);
router.get('/stats/employee/:userId', authenticate, statsCtrl.employeeStats);

// Export
router.get('/export/excel', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), exportCtrl.exportExcel);
router.get('/export/pdf', authenticate, requireRole('ADMIN', 'MANAGER', 'SUPER_ADMIN'), exportCtrl.exportPDF);

// Stores (Super Admin / Admin)
router.get('/stores', authenticate, requireRole('SUPER_ADMIN'), storeCtrl.listStores);
router.get('/stores/current', authenticate, storeCtrl.getStore);
router.post('/stores', authenticate, requireRole('SUPER_ADMIN'), storeCtrl.createStore);
router.put('/stores/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), storeCtrl.updateStore);
router.post('/stores/invite', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), storeCtrl.generateInviteCode);

export default router;
