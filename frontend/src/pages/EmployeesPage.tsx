import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Edit, Trash2, Key, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROLE_LABELS } from '@/lib/utils';
import type { Employee } from '@/types';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Min 8 caratteri').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  phone: z.string().optional(),
  iban: z.string().optional(),
  fiscalCode: z.string().optional(),
  weeklyHours: z.number().min(1).max(60).default(40),
  canClockIn: z.boolean().default(false),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof employeeSchema>;

export function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; employee?: Employee }>({ open: false });
  const [resetModal, setResetModal] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Dipendente disattivato'); },
  });

  const filtered = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dipendenti</h1>
        <Button onClick={() => setModal({ open: true })}>
          <Plus className="w-4 h-4" />
          Aggiungi dipendente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                      <Badge variant={emp.isActive ? 'success' : 'danger'}>
                        {emp.isActive ? 'Attivo' : 'Inattivo'}
                      </Badge>
                      {emp.canClockIn && (
                        <Badge variant="info">
                          <MapPin className="w-3 h-3 mr-0.5" />
                          Timbratura
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{emp.email} · {ROLE_LABELS[emp.role]}</p>
                    <p className="text-xs text-gray-400">{emp.weeklyHours}h/sett. {emp.phone ? `· ${emp.phone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal({ open: true, employee: emp })}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setResetModal(emp)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Disattivare questo dipendente?')) deleteMutation.mutate(emp.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-10">Nessun dipendente trovato</p>
          )}
        </div>
      )}

      <EmployeeFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        employee={modal.employee}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); }}
      />

      {resetModal && (
        <ResetPasswordModal
          employee={resetModal}
          onClose={() => setResetModal(null)}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({ isOpen, onClose, employee, onSaved }: {
  isOpen: boolean; onClose: () => void; employee?: Employee; onSaved: () => void;
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
      phone: employee.phone ?? '',
      iban: employee.iban ?? '',
      fiscalCode: employee.fiscalCode ?? '',
      weeklyHours: employee.weeklyHours,
      canClockIn: employee.canClockIn,
      notes: employee.notes ?? '',
    } : { role: 'EMPLOYEE', weeklyHours: 40, canClockIn: false },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (employee) return employeeApi.update(employee.id, data);
      if (!data.password) throw new Error('Password richiesta');
      return employeeApi.create(data);
    },
    onSuccess: () => { toast.success(employee ? 'Dipendente aggiornato' : 'Dipendente creato'); onSaved(); reset(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Errore';
      toast.error(msg);
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Modifica dipendente' : 'Nuovo dipendente'} size="lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Cognome" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message} disabled={!!employee} {...register('email')} />
        {!employee && (
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Ruolo" error={errors.role?.message} {...register('role')}>
            <option value="EMPLOYEE">Dipendente</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Input label="Ore settimanali" type="number" {...register('weeklyHours', { valueAsNumber: true })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Telefono" {...register('phone')} />
          <Input label="Codice Fiscale" {...register('fiscalCode')} />
        </div>
        <Input label="IBAN (cifrato)" {...register('iban')} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="canClockIn" {...register('canClockIn')} className="w-4 h-4 accent-primary-600" />
          <label htmlFor="canClockIn" className="text-sm font-medium text-gray-700">Abilita timbratura con GPS</label>
        </div>
        <Input label="Note" {...register('notes')} />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          {employee ? 'Salva modifiche' : 'Crea dipendente'}
        </Button>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [pwd, setPwd] = useState('');

  const mutation = useMutation({
    mutationFn: () => employeeApi.resetPassword(employee.id, pwd),
    onSuccess: () => { toast.success('Password reimpostata'); onClose(); },
    onError: () => toast.error('Errore nel reset password'),
  });

  return (
    <Modal isOpen onClose={onClose} title={`Reset password — ${employee.firstName} ${employee.lastName}`}>
      <div className="space-y-4">
        <Input
          label="Nuova password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          helperText="Minimo 8 caratteri"
        />
        <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={pwd.length < 8}>
          Reimposta password
        </Button>
      </div>
    </Modal>
  );
}
