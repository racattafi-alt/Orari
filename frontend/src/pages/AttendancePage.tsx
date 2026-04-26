import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, employeeApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatMinutes } from '@/lib/utils';
import { Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Attendance, Employee } from '@/types';

export function AttendancePage() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [userId, setUserId] = useState('');
  const [manualModal, setManualModal] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ['employees'], queryFn: employeeApi.list });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['attendance', year, month, userId],
    queryFn: () => attendanceApi.list({ year, month, userId: userId || undefined }),
  });

  const totalWorked = attendance.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0);
  const daysWorked = attendance.filter((a) => a.clockIn).length;
  const invalidCount = attendance.filter((a) => !a.clockInValid || !a.clockOutValid).length;

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(new Date(2024, i, 1), 'MMMM', { locale: it }),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Presenze</h1>
        <Button onClick={() => setManualModal(true)}>
          <Plus className="w-4 h-4" />
          Inserimento manuale
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-36">
          {months.map((m) => <option key={m.value} value={m.value} className="capitalize">{m.label}</option>)}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-52">
          <option value="">Tutti i dipendenti</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-2xl font-bold text-primary-600">{daysWorked}</p>
            <p className="text-xs text-gray-500">Giorni presenti</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-2xl font-bold text-green-600">{formatMinutes(totalWorked)}</p>
            <p className="text-xs text-gray-500">Ore totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className={`text-2xl font-bold ${invalidCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{invalidCount}</p>
            <p className="text-xs text-gray-500">Anomalie GPS</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Registro presenze</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dipendente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entrata</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Uscita</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ore</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.user ? `${a.user.firstName} ${a.user.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {format(new Date(a.date), 'EEE d MMM', { locale: it })}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {a.clockIn ? format(new Date(a.clockIn), 'HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {a.workedMinutes ? formatMinutes(a.workedMinutes) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.isManual && <Badge variant="warning">Manuale</Badge>}
                        {(!a.clockInValid || !a.clockOutValid) && (
                          <Badge variant="warning">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />
                            GPS
                          </Badge>
                        )}
                        {a.clockInValid && a.clockOutValid && a.clockOut && (
                          <Badge variant="success">OK</Badge>
                        )}
                        {!a.clockOut && a.clockIn && (
                          <Badge variant="info">In corso</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      Nessuna presenza registrata
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ManualAttendanceModal
        isOpen={manualModal}
        onClose={() => setManualModal(false)}
        employees={employees}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['attendance'] }); setManualModal(false); }}
      />
    </div>
  );
}

function ManualAttendanceModal({ isOpen, onClose, employees, onSaved }: {
  isOpen: boolean; onClose: () => void; employees: Employee[]; onSaved: () => void;
}) {
  const [form, setForm] = useState({ userId: '', date: format(new Date(), 'yyyy-MM-dd'), clockIn: '', clockOut: '', notes: '' });

  const mutation = useMutation({
    mutationFn: () => attendanceApi.createManual({
      userId: form.userId,
      date: form.date,
      clockIn: `${form.date}T${form.clockIn}:00.000Z`,
      clockOut: form.clockOut ? `${form.date}T${form.clockOut}:00.000Z` : undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => { toast.success('Presenza inserita'); onSaved(); },
    onError: () => toast.error('Errore inserimento'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inserimento manuale presenza">
      <div className="space-y-4">
        <Select label="Dipendente" value={form.userId} onChange={f('userId')}>
          <option value="">Seleziona dipendente</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </Select>
        <Input label="Data" type="date" value={form.date} onChange={f('date') as React.ChangeEventHandler<HTMLInputElement>} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Entrata" type="time" value={form.clockIn} onChange={f('clockIn') as React.ChangeEventHandler<HTMLInputElement>} />
          <Input label="Uscita" type="time" value={form.clockOut} onChange={f('clockOut') as React.ChangeEventHandler<HTMLInputElement>} />
        </div>
        <Input label="Note" value={form.notes} onChange={f('notes') as React.ChangeEventHandler<HTMLInputElement>} />
        <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!form.userId || !form.clockIn}>
          Salva presenza
        </Button>
      </div>
    </Modal>
  );
}
