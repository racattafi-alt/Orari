import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi, holidayApi, employeeApi } from '@/services/api';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeft, ChevronRight, Plus, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { SHIFT_TYPE_LABELS } from '@/lib/utils';
import type { Employee, Schedule, Shift, ShiftType } from '@/types';

export function SchedulePage() {
  const qc = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [entryModal, setEntryModal] = useState<{ date?: string; entryId?: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: schedule, isLoading } = useQuery<Schedule>({
    queryKey: ['schedule', year, month],
    queryFn: () => scheduleApi.getOrCreate(year, month),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidayApi.list(year),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeApi.list,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['shifts'],
    queryFn: scheduleApi.getShifts,
  });

  const publishMutation = useMutation({
    mutationFn: () => scheduleApi.publish(schedule!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', year, month] });
      toast.success('Orario pubblicato! I dipendenti possono vederlo.');
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => scheduleApi.deleteEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', year, month] });
      setEntryModal(null);
      toast.success('Turno eliminato');
    },
  });

  const monthTitle = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: it });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Orario mensile</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {schedule && !schedule.isPublished && (
            <Button
              variant="primary"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              <Send className="w-4 h-4" />
              Pubblica orario
            </Button>
          )}
          {schedule?.isPublished && (
            <Badge variant="success">Pubblicato</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 capitalize min-w-[160px] text-center">
            {monthTitle}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tutti i dipendenti</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isLoading && schedule && (
        <ScheduleCalendar
          schedule={schedule}
          holidays={holidays}
          shifts={shifts}
          employees={employees}
          selectedUserId={selectedUser || undefined}
          onDateClick={(date) => setEntryModal({ date })}
          onEventClick={(entryId) => setEntryModal({ entryId })}
        />
      )}

      <EntryModal
        isOpen={!!entryModal}
        onClose={() => setEntryModal(null)}
        date={entryModal?.date}
        entryId={entryModal?.entryId}
        scheduleId={schedule?.id}
        employees={employees}
        shifts={shifts}
        existingEntry={schedule?.entries.find((e) => e.id === entryModal?.entryId)}
        onDelete={(id) => deleteEntryMutation.mutate(id)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['schedule', year, month] });
          setEntryModal(null);
        }}
      />
    </div>
  );
}

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date?: string;
  entryId?: string;
  scheduleId?: string;
  employees: Employee[];
  shifts: Shift[];
  existingEntry?: Schedule['entries'][0];
  onDelete: (id: string) => void;
  onSaved: () => void;
}

function EntryModal({ isOpen, onClose, date, entryId, scheduleId, employees, shifts, existingEntry, onDelete, onSaved }: EntryModalProps) {
  const [form, setForm] = useState({
    userId: existingEntry?.userId ?? '',
    startTime: existingEntry?.startTime ?? '09:00',
    endTime: existingEntry?.endTime ?? '17:00',
    breakMinutes: String(existingEntry?.breakMinutes ?? 0),
    shiftType: existingEntry?.shiftType ?? 'NORMAL',
    notes: existingEntry?.notes ?? '',
  });

  const saveMutation = useMutation({
    mutationFn: () => scheduleApi.upsertEntry(scheduleId!, {
      userId: form.userId,
      date: date ?? existingEntry?.date ?? '',
      startTime: form.startTime,
      endTime: form.endTime,
      breakMinutes: parseInt(form.breakMinutes) || 0,
      shiftType: form.shiftType as Schedule['entries'][0]['shiftType'],
      notes: form.notes || undefined,
    }),
    onSuccess: onSaved,
    onError: () => toast.error('Errore nel salvataggio'),
  });

  const applyShift = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (shift) {
      setForm((f) => ({ ...f, startTime: shift.startTime, endTime: shift.endTime, breakMinutes: String(shift.breakMinutes) }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryId ? 'Modifica turno' : `Aggiungi turno — ${date}`}
    >
      <div className="space-y-4">
        <Select
          label="Dipendente"
          value={form.userId}
          onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
        >
          <option value="">Seleziona dipendente</option>
          {employees.filter((e) => e.isActive).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </Select>

        {shifts.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Turno rapido</p>
            <div className="flex flex-wrap gap-1.5">
              {shifts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyShift(s.id)}
                  style={{ borderColor: s.color }}
                  className="px-2.5 py-1 text-xs rounded-full border-2 hover:opacity-80 transition-opacity font-medium"
                >
                  {s.name} ({s.startTime}–{s.endTime})
                </button>
              ))}
            </div>
          </div>
        )}

        <Select
          label="Tipo turno"
          value={form.shiftType}
          onChange={(e) => setForm((f) => ({ ...f, shiftType: e.target.value as ShiftType }))}
        >
          {Object.entries(SHIFT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>

        {!['DAY_OFF', 'SICK', 'VACATION', 'PERMIT'].includes(form.shiftType) && (
          <div className="grid grid-cols-3 gap-3">
            <Input label="Inizio" type="time" value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            <Input label="Fine" type="time" value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            <Input label="Pausa (min)" type="number" min="0" value={form.breakMinutes}
              onChange={(e) => setForm((f) => ({ ...f, breakMinutes: e.target.value }))} />
          </div>
        )}

        <Input label="Note (opzionale)" value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!form.userId}
          >
            Salva
          </Button>
          {entryId && (
            <Button variant="danger" onClick={() => onDelete(entryId)}>
              Elimina
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
