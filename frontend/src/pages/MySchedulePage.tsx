import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, holidayApi } from '@/services/api';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { SHIFT_TYPE_LABELS, calcShiftMinutes, formatMinutes } from '@/lib/utils';
import type { Schedule } from '@/types';

export function MySchedulePage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: schedule } = useQuery<Schedule | null>({
    queryKey: ['schedule', 'my', year, month],
    queryFn: () => scheduleApi.getMy(year, month),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidayApi.list(year),
  });

  const entries = schedule?.entries ?? [];
  const totalMinutes = entries
    .filter((e) => !['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(e.shiftType))
    .reduce((acc, e) => acc + calcShiftMinutes(e.startTime, e.endTime, e.breakMinutes), 0);

  const monthTitle = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: it });

  const myEmployee = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    weeklyHours: 40,
    isActive: true,
    canClockIn: user.canClockIn,
    createdAt: '',
  } : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">I miei orari</h1>
        {!schedule?.isPublished && schedule && (
          <Badge variant="warning">Non ancora pubblicato</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 capitalize min-w-[160px] text-center">
          {monthTitle}
        </h2>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-2xl font-bold text-primary-600">{entries.length}</p>
            <p className="text-xs text-gray-500">Turni pianificati</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-2xl font-bold text-green-600">{formatMinutes(totalMinutes)}</p>
            <p className="text-xs text-gray-500">Ore totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-2xl font-bold text-amber-600">
              {entries.filter((e) => ['VACATION', 'PERMIT'].includes(e.shiftType)).length}
            </p>
            <p className="text-xs text-gray-500">Ferie/Permessi</p>
          </CardContent>
        </Card>
      </div>

      <ScheduleCalendar
        schedule={schedule ?? null}
        holidays={holidays}
        shifts={[]}
        employees={myEmployee ? [myEmployee] : []}
        selectedUserId={user?.id}
        readOnly
      />

      {entries.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-800 mb-3">Dettaglio turni</h3>
            <div className="space-y-2">
              {entries
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => {
                  const isAbsence = ['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(e.shiftType);
                  return (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {format(new Date(e.date), 'EEE d MMM', { locale: it })}
                        </p>
                        {e.notes && <p className="text-xs text-gray-400">{e.notes}</p>}
                      </div>
                      <div className="text-right">
                        {isAbsence ? (
                          <Badge variant="gray">{SHIFT_TYPE_LABELS[e.shiftType]}</Badge>
                        ) : (
                          <div>
                            <p className="text-sm font-semibold text-primary-600">
                              {e.startTime} – {e.endTime}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatMinutes(calcShiftMinutes(e.startTime, e.endTime, e.breakMinutes))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
