import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi, scheduleApi, attendanceApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ClockInOut } from '@/components/attendance/ClockInOut';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { formatMinutes } from '@/lib/utils';
import { Users, Clock, TrendingUp, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { StoreStats, Schedule } from '@/types';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { isManager } = usePermissions();
  const now = new Date();

  const { data: stats } = useQuery<StoreStats>({
    queryKey: ['stats', 'store'],
    queryFn: statsApi.store,
    enabled: isManager,
  });

  const { data: mySchedule } = useQuery<Schedule | null>({
    queryKey: ['schedule', 'my', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => scheduleApi.getMy(now.getFullYear(), now.getMonth() + 1),
  });

  const todayEntries = mySchedule?.entries.filter(
    (e) => e.date === format(now, 'yyyy-MM-dd')
  ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ciao, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {format(now, 'EEEE d MMMM yyyy', { locale: it })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          {user?.canClockIn ? (
            <ClockInOut />
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-4 space-y-2">
                  <CalendarDays className="w-10 h-10 text-primary-400 mx-auto" />
                  <p className="font-medium text-gray-700">Il tuo orario di oggi</p>
                  {todayEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">Nessun turno previsto</p>
                  ) : (
                    todayEntries.map((e) => (
                      <div key={e.id} className="bg-primary-50 rounded-lg p-3 text-left">
                        <p className="text-primary-700 font-semibold">{e.startTime} – {e.endTime}</p>
                        {e.notes && <p className="text-xs text-gray-500 mt-1">{e.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isManager && stats && (
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatCard
              icon={<Users className="w-6 h-6 text-primary-600" />}
              label="Dipendenti attivi"
              value={String(stats.activeEmployees)}
              sub={`su ${stats.totalEmployees} totali`}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-green-600" />}
              label="Ore questo mese"
              value={`${stats.totalMonthHours}h`}
              sub="ore lavorate"
              iconBg="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
              label="Media ore/dipendente"
              value={`${stats.avgHoursPerEmployee}h`}
              sub="questo mese"
              iconBg="bg-amber-50"
            />
            <StatCard
              icon={<CalendarDays className="w-6 h-6 text-purple-600" />}
              label="Ore anno corrente"
              value={`${stats.totalYearHours}h`}
              sub="totale"
              iconBg="bg-purple-50"
            />
          </div>
        )}
      </div>

      {mySchedule && mySchedule.entries.length > 0 && !isManager && (
        <Card>
          <CardHeader><CardTitle>Prossimi turni</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mySchedule.entries
                .filter((e) => new Date(e.date) >= now)
                .slice(0, 5)
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {format(new Date(e.date), 'EEE d MMM', { locale: it })}
                      </p>
                    </div>
                    <p className="text-sm text-primary-600 font-semibold">
                      {e.startTime} – {e.endTime}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, iconBg = 'bg-primary-50' }: {
  icon: ReactNode; label: string; value: string; sub: string; iconBg?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
