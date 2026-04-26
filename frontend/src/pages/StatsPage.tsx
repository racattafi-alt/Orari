import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi, employeeApi } from '@/services/api';
import { StoreStatsCharts, EmployeeStatsCharts } from '@/components/stats/StatsCharts';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import type { StoreStats, EmployeeStats, Employee } from '@/types';

export function StatsPage() {
  const { isManager } = usePermissions();
  const { user } = useAuthStore();
  const now = new Date();

  const [selectedUserId, setSelectedUserId] = useState(user?.id ?? '');
  const [year, setYear] = useState(now.getFullYear());

  const { data: storeStats } = useQuery<StoreStats>({
    queryKey: ['stats', 'store'],
    queryFn: statsApi.store,
    enabled: isManager,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeApi.list,
    enabled: isManager,
  });

  const { data: empStats } = useQuery<EmployeeStats>({
    queryKey: ['stats', 'employee', selectedUserId, year],
    queryFn: () => statsApi.employee(selectedUserId, year),
    enabled: !!selectedUserId,
  });

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Statistiche</h1>

      {isManager && storeStats && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Panoramica negozio</h2>
          <StoreStatsCharts stats={storeStats} />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Statistiche dipendente</h2>
          {isManager && (
            <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-52">
              <option value="">Seleziona dipendente</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </Select>
          )}
          <Select value={String(year)} onChange={(e) => setYear(parseInt(e.target.value))} className="w-28">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>

        {empStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="text-center py-3">
                  <p className="text-2xl font-bold text-primary-600">{empStats.totalWorkedHours}h</p>
                  <p className="text-xs text-gray-500">Ore lavorate {year}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-3">
                  <p className="text-2xl font-bold text-green-600">{empStats.totalDaysWorked}</p>
                  <p className="text-xs text-gray-500">Giorni lavorati</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-3">
                  <p className="text-2xl font-bold text-amber-600">{empStats.averageHoursPerDay}h</p>
                  <p className="text-xs text-gray-500">Media/giorno</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-3">
                  <p className="text-2xl font-bold text-purple-600">{empStats.user.weeklyHours}h</p>
                  <p className="text-xs text-gray-500">Contratto/sett.</p>
                </CardContent>
              </Card>
            </div>
            <EmployeeStatsCharts stats={empStats} />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            {isManager ? 'Seleziona un dipendente' : 'Caricamento statistiche...'}
          </p>
        )}
      </div>
    </div>
  );
}
