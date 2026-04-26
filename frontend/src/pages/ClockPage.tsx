import { useAuthStore } from '@/store/authStore';
import { ClockInOut } from '@/components/attendance/ClockInOut';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatMinutes } from '@/lib/utils';
import type { Attendance } from '@/types';

export function ClockPage() {
  const { user } = useAuthStore();
  const now = new Date();

  const { data: history = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', 'my-month'],
    queryFn: () => attendanceApi.list({
      userId: user?.id,
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    }),
  });

  if (!user?.canClockIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Timbratura non abilitata per il tuo account.</p>
          <p className="text-gray-300 text-sm mt-1">Contatta l'amministratore.</p>
        </div>
      </div>
    );
  }

  const totalMinutes = history.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0);

  return (
    <div className="space-y-5 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Timbratura</h1>

      <ClockInOut />

      <Card>
        <CardHeader><CardTitle>Questo mese</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-xl font-bold text-primary-600">{history.filter((a) => a.clockIn).length}</p>
              <p className="text-xs text-gray-500">Giorni presenti</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{formatMinutes(totalMinutes)}</p>
              <p className="text-xs text-gray-500">Ore totali</p>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.slice(0, 20).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600 capitalize">
                  {format(new Date(a.date), 'EEE d MMM', { locale: it })}
                </span>
                <span className="font-mono text-gray-700">
                  {a.clockIn ? format(new Date(a.clockIn), 'HH:mm') : '—'}
                  {' → '}
                  {a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : '…'}
                  {a.workedMinutes ? ` (${formatMinutes(a.workedMinutes)})` : ''}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
