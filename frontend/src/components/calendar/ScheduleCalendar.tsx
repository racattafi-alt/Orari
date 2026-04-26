import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import itLocale from '@fullcalendar/core/locales/it';
import { useMemo } from 'react';
import type { Schedule, Holiday, Shift, Employee } from '@/types';
import { SHIFT_TYPE_LABELS } from '@/lib/utils';

interface ScheduleCalendarProps {
  schedule: Schedule | null;
  holidays: Holiday[];
  shifts: Shift[];
  employees: Employee[];
  selectedUserId?: string;
  onDateClick?: (date: string) => void;
  onEventClick?: (entryId: string) => void;
  readOnly?: boolean;
}

export function ScheduleCalendar({
  schedule, holidays, employees, selectedUserId,
  onDateClick, onEventClick, readOnly = false,
}: ScheduleCalendarProps) {
  const events = useMemo(() => {
    const evts: object[] = [];

    // Holiday events (background)
    for (const h of holidays) {
      evts.push({
        id: `holiday-${h.date}-${h.name}`,
        title: h.name,
        start: h.date,
        allDay: true,
        display: 'background',
        backgroundColor: h.type === 'NATIONAL' ? '#fee2e2' : h.type === 'LOCAL' ? '#fef9c3' : '#f0fdf4',
        classNames: ['holiday-event'],
      });
    }

    // Schedule entries
    for (const entry of schedule?.entries ?? []) {
      if (selectedUserId && entry.userId !== selectedUserId) continue;

      const emp = employees.find((e) => e.id === entry.userId);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Dipendente';
      const isAbsence = ['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(entry.shiftType);

      evts.push({
        id: entry.id,
        title: isAbsence
          ? `${empName} — ${SHIFT_TYPE_LABELS[entry.shiftType]}`
          : `${empName}\n${entry.startTime}–${entry.endTime}`,
        start: entry.date,
        allDay: true,
        backgroundColor: getEntryColor(entry.shiftType),
        borderColor: 'transparent',
        textColor: '#1e293b',
        extendedProps: { entryId: entry.id },
      });
    }

    return evts;
  }, [schedule, holidays, employees, selectedUserId]);

  function getEntryColor(shiftType: string): string {
    const colors: Record<string, string> = {
      NORMAL: '#bfdbfe', OVERTIME: '#fed7aa', HOLIDAY_WORK: '#fecaca',
      ON_CALL: '#fef9c3', TRAINING: '#e9d5ff', DAY_OFF: '#e5e7eb',
      SICK: '#fce7f3', VACATION: '#bbf7d0', PERMIT: '#99f6e4',
    };
    return colors[shiftType] ?? '#bfdbfe';
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={itLocale}
        events={events}
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
        height="auto"
        dateClick={readOnly ? undefined : (info) => onDateClick?.(info.dateStr)}
        eventClick={(info) => {
          const entryId = info.event.extendedProps.entryId;
          if (entryId) onEventClick?.(entryId);
        }}
        eventDisplay="block"
        dayCellClassNames={(arg) => {
          const dow = arg.date.getDay();
          return dow === 0 || dow === 6 ? ['weekend-day'] : [];
        }}
      />
    </div>
  );
}
