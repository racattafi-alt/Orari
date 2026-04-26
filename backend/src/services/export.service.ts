import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';
import { format, getDaysInMonth } from 'date-fns';
import { it } from 'date-fns/locale';

const SHIFT_TYPE_LABELS: Record<string, string> = {
  NORMAL: 'Normale', OVERTIME: 'Straordinario', HOLIDAY_WORK: 'Festivo',
  ON_CALL: 'Reperibilità', TRAINING: 'Formazione', DAY_OFF: 'Riposo',
  SICK: 'Malattia', VACATION: 'Ferie', PERMIT: 'Permesso',
};

export async function exportScheduleExcel(storeId: string, year: number, month: number): Promise<Buffer> {
  const schedule = await prisma.schedule.findUnique({
    where: { storeId_year_month: { storeId, year, month } },
    include: {
      entries: {
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: [{ userId: 'asc' }, { date: 'asc' }],
      },
      store: { select: { name: true } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Orari App';
  const ws = workbook.addWorksheet(`${month}/${year}`, { views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] });

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: it });

  // Header row 1: store name + month
  ws.mergeCells(1, 1, 1, daysInMonth + 3);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `${schedule?.store.name ?? 'Negozio'} — Orario ${monthName}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  // Header row 2: Employee | Day 1 | Day 2 | ...
  ws.getCell(2, 1).value = 'Dipendente';
  ws.getCell(2, 1).font = { bold: true };
  ws.getCell(2, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = format(date, 'EEE', { locale: it });
    const cell = ws.getCell(2, d + 1);
    cell.value = `${dow}\n${d}`;
    cell.alignment = { horizontal: 'center', wrapText: true };
    cell.font = { bold: true, size: 9 };
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isWeekend ? 'FFFFCCCC' : 'FFD9E1F2' } };
  }
  ws.getCell(2, daysInMonth + 2).value = 'Ore Tot.';
  ws.getCell(2, daysInMonth + 2).font = { bold: true };
  ws.getCell(2, daysInMonth + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

  // Group entries by user
  const userMap: Record<string, { name: string; entries: Record<string, { start: string; end: string; type: string }> }> = {};
  for (const entry of schedule?.entries ?? []) {
    const uid = entry.user.firstName + ' ' + entry.user.lastName;
    if (!userMap[uid]) userMap[uid] = { name: uid, entries: {} };
    const dateKey = format(entry.date, 'yyyy-MM-dd');
    userMap[uid].entries[dateKey] = { start: entry.startTime, end: entry.endTime, type: entry.shiftType };
  }

  let row = 3;
  for (const [, userData] of Object.entries(userMap)) {
    const rowCells = ws.getRow(row);
    ws.getCell(row, 1).value = userData.name;
    ws.getCell(row, 1).font = { bold: false };

    let totalMinutes = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = userData.entries[dateKey];
      const cell = ws.getCell(row, d + 1);
      if (entry) {
        if (['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(entry.type)) {
          cell.value = SHIFT_TYPE_LABELS[entry.type]?.substring(0, 3) ?? '—';
        } else {
          cell.value = `${entry.start}-${entry.end}`;
          const [sh, sm] = entry.start.split(':').map(Number);
          const [eh, em] = entry.end.split(':').map(Number);
          totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
        }
        cell.alignment = { horizontal: 'center', wrapText: true };
        cell.font = { size: 8 };
      }
      const date = new Date(year, month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      }
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    ws.getCell(row, daysInMonth + 2).value = `${h}h${m > 0 ? m + 'm' : ''}`;
    ws.getCell(row, daysInMonth + 2).alignment = { horizontal: 'center' };
    row++;
  }

  // Column widths
  ws.getColumn(1).width = 22;
  for (let d = 2; d <= daysInMonth + 1; d++) ws.getColumn(d).width = 8;
  ws.getColumn(daysInMonth + 2).width = 10;

  // Border all cells
  for (let r = 2; r < row; r++) {
    for (let c = 1; c <= daysInMonth + 2; c++) {
      ws.getCell(r, c).border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    }
  }

  ws.getRow(2).height = 30;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportSchedulePDF(storeId: string, year: number, month: number): Promise<Buffer> {
  const schedule = await prisma.schedule.findUnique({
    where: { storeId_year_month: { storeId, year, month } },
    include: {
      entries: {
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: [{ userId: 'asc' }, { date: 'asc' }],
      },
      store: { select: { name: true } },
    },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: it });

    doc.fontSize(16).text(`${schedule?.store.name ?? ''} — Orario ${monthName}`, { align: 'center' });
    doc.moveDown(0.5);

    // Group by user
    const userEntries: Record<string, { name: string; days: Record<number, string> }> = {};
    for (const entry of schedule?.entries ?? []) {
      const key = `${entry.user.lastName} ${entry.user.firstName}`;
      if (!userEntries[key]) userEntries[key] = { name: key, days: {} };
      const day = new Date(entry.date).getDate();
      if (['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(entry.shiftType)) {
        userEntries[key].days[day] = SHIFT_TYPE_LABELS[entry.shiftType].substring(0, 3);
      } else {
        userEntries[key].days[day] = `${entry.startTime}-${entry.endTime}`;
      }
    }

    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const colW = (doc.page.width - 60 - 100) / daysInMonth;
    const rowH = 18;

    // Header
    let x = 30;
    let y = doc.y;
    doc.rect(x, y, 100, rowH).fillAndStroke('#D9E1F2', '#000');
    doc.fillColor('#000').fontSize(8).text('Dipendente', x + 2, y + 5, { width: 96 });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dow = format(date, 'EEE', { locale: it }).charAt(0).toUpperCase();
      const isWE = date.getDay() === 0 || date.getDay() === 6;
      doc.rect(x + 100 + (d - 1) * colW, y, colW, rowH).fillAndStroke(isWE ? '#FFCCCC' : '#D9E1F2', '#000');
      doc.fillColor('#000').fontSize(7).text(`${dow}${d}`, x + 100 + (d - 1) * colW + 1, y + 4, { width: colW - 2, align: 'center' });
    }

    y += rowH;
    for (const [, data] of Object.entries(userEntries).sort(([a], [b]) => a.localeCompare(b))) {
      doc.rect(30, y, 100, rowH).stroke();
      doc.fontSize(7).fillColor('#000').text(data.name, 32, y + 5, { width: 96 });

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const isWE = date.getDay() === 0 || date.getDay() === 6;
        doc.rect(x + 100 + (d - 1) * colW, y, colW, rowH).fillAndStroke(isWE ? '#FFFFF2' : '#FFF', '#CCC');
        const txt = data.days[d] || '';
        doc.fontSize(6).fillColor('#000').text(txt, x + 100 + (d - 1) * colW + 1, y + 5, { width: colW - 2, align: 'center' });
      }
      y += rowH;
    }

    doc.end();
  });
}
