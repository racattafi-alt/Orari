import { Request, Response, NextFunction } from 'express';
import { exportScheduleExcel, exportSchedulePDF } from '../services/export.service';
import { z } from 'zod';
import { format } from 'date-fns';

const exportParams = z.object({
  year: z.string().transform(Number),
  month: z.string().transform(Number),
});

export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = exportParams.parse(req.query);
    const buffer = await exportScheduleExcel(req.user!.storeId, year, month);
    const filename = `orario_${year}_${String(month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

export async function exportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = exportParams.parse(req.query);
    const buffer = await exportSchedulePDF(req.user!.storeId, year, month);
    const filename = `orario_${year}_${String(month).padStart(2, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}
