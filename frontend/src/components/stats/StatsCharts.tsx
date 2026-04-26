import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SHIFT_TYPE_LABELS } from '@/lib/utils';
import type { StoreStats, EmployeeStats } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280'];

interface StoreStatsChartsProps {
  stats: StoreStats;
}

export function StoreStatsCharts({ stats }: StoreStatsChartsProps) {
  const shiftData = Object.entries(stats.shiftDistribution).map(([key, value]) => ({
    name: SHIFT_TYPE_LABELS[key] || key,
    value,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <CardHeader><CardTitle>Ore lavorate per mese</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}h`, 'Ore']} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Distribuzione turni (mese corrente)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={shiftData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {shiftData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmployeeStatsChartsProps {
  stats: EmployeeStats;
}

export function EmployeeStatsCharts({ stats }: EmployeeStatsChartsProps) {
  const shiftData = Object.entries(stats.shiftTypes).map(([key, value]) => ({
    name: SHIFT_TYPE_LABELS[key] || key,
    value,
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Ore lavorate vs pianificate</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [`${v}h`, name === 'workedHours' ? 'Lavorate' : 'Pianificate']} />
              <Legend formatter={(v) => v === 'workedHours' ? 'Ore lavorate' : 'Ore pianificate'} />
              <Bar dataKey="workedHours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="scheduledHours" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Giorni lavorati per mese</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="daysWorked" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tipi di turno</CardTitle></CardHeader>
          <CardContent>
            {shiftData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nessun dato disponibile</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={shiftData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {shiftData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
