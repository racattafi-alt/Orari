import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi, holidayApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Plus, RefreshCw, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store, Holiday } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export function AdminPage() {
  const qc = useQueryClient();
  const now = new Date();

  const { data: store } = useQuery<Store>({ queryKey: ['store'], queryFn: storeApi.current });
  const { data: holidays = [] } = useQuery<Holiday[]>({ queryKey: ['holidays', now.getFullYear()], queryFn: () => holidayApi.list(now.getFullYear()) });

  const [inviteModal, setInviteModal] = useState(false);
  const [customHolidayModal, setCustomHolidayModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [storeEdit, setStoreEdit] = useState(false);

  const refreshHolidaysMutation = useMutation({
    mutationFn: () => holidayApi.refresh(now.getFullYear()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['holidays'] }); toast.success('Festività aggiornate'); },
  });

  const nationalHolidays = holidays.filter((h) => h.type === 'NATIONAL');
  const localHolidays = holidays.filter((h) => h.type !== 'NATIONAL');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Gestione negozio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Store info */}
        <Card>
          <CardHeader className="flex-row flex items-center justify-between">
            <CardTitle>Informazioni negozio</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setStoreEdit(true)}>Modifica</Button>
          </CardHeader>
          <CardContent>
            {store && (
              <div className="space-y-2 text-sm">
                <Row label="Nome" value={store.name} />
                <Row label="Città" value={`${store.city} (${store.province})`} />
                <Row label="Regione" value={store.region} />
                <Row label="Fuso orario" value={store.timezone} />
                {store.address && <Row label="Indirizzo" value={store.address} />}
                {store.phone && <Row label="Telefono" value={store.phone} />}
                {store.email && <Row label="Email" value={store.email} />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite codes */}
        <Card>
          <CardHeader><CardTitle>Codici invito</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Genera un codice per invitare dipendenti a registrarsi. I codici scadono dopo 7 giorni.
            </p>
            <Button onClick={() => setInviteModal(true)} className="w-full">
              <Plus className="w-4 h-4" />
              Genera codice invito
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Holidays */}
      <Card>
        <CardHeader className="flex-row flex items-center justify-between">
          <CardTitle>Festività {now.getFullYear()}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCustomHolidayModal(true)}>
              <Plus className="w-4 h-4" />
              Aggiungi
            </Button>
            <Button size="sm" variant="secondary" onClick={() => refreshHolidaysMutation.mutate()} loading={refreshHolidaysMutation.isPending}>
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nazionali ({nationalHolidays.length})</p>
              <div className="space-y-1">
                {nationalHolidays.map((h) => (
                  <div key={`${h.date}-${h.name}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{h.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{format(new Date(h.date), 'd MMMM', { locale: it })}</p>
                    </div>
                    <Badge variant="default">Nazionale</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Locali & Custom ({localHolidays.length})</p>
              <div className="space-y-1">
                {localHolidays.map((h) => (
                  <div key={`${h.date}-${h.name}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{h.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{format(new Date(h.date), 'd MMMM', { locale: it })}</p>
                    </div>
                    <Badge variant={h.type === 'CUSTOM' ? 'warning' : 'info'}>
                      {h.type === 'LOCAL' ? 'Locale' : h.type === 'REGIONAL' ? 'Regionale' : 'Custom'}
                    </Badge>
                  </div>
                ))}
                {localHolidays.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">Nessuna festività locale rilevata</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <InviteModal
        isOpen={inviteModal}
        onClose={() => { setInviteModal(false); setGeneratedCode(null); }}
        generatedCode={generatedCode}
        onGenerate={setGeneratedCode}
      />

      <CustomHolidayModal
        isOpen={customHolidayModal}
        onClose={() => setCustomHolidayModal(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['holidays'] })}
      />

      {storeEdit && store && (
        <StoreEditModal store={store} onClose={() => setStoreEdit(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ['store'] }); setStoreEdit(false); }} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function InviteModal({ isOpen, onClose, generatedCode, onGenerate }: {
  isOpen: boolean; onClose: () => void; generatedCode: string | null; onGenerate: (code: string) => void;
}) {
  const [role, setRole] = useState('EMPLOYEE');

  const mutation = useMutation({
    mutationFn: () => storeApi.createInvite(role),
    onSuccess: (data) => onGenerate(data.code),
    onError: () => toast.error('Errore generazione codice'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Genera codice invito">
      <div className="space-y-4">
        <Select label="Ruolo" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="EMPLOYEE">Dipendente</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Genera codice
        </Button>
        {generatedCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-xs text-green-600 mb-1">Codice invito (valido 7 giorni)</p>
            <p className="text-3xl font-mono font-bold text-green-700 tracking-widest">{generatedCode}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success('Copiato!'); }}
              className="mt-2 flex items-center gap-1 text-xs text-green-600 mx-auto hover:underline"
            >
              <Copy className="w-3 h-3" />
              Copia
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CustomHolidayModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => holidayApi.addCustom(date, name),
    onSuccess: () => { toast.success('Festività aggiunta'); onSaved(); onClose(); },
    onError: () => toast.error('Errore'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi festività custom">
      <div className="space-y-4">
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Nome festività" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Patrono locale" />
        <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!date || !name}>
          Aggiungi
        </Button>
      </div>
    </Modal>
  );
}

function StoreEditModal({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: store.name, city: store.city, province: store.province,
    region: store.region, address: store.address ?? '', phone: store.phone ?? '', email: store.email ?? '',
  });

  const mutation = useMutation({
    mutationFn: () => storeApi.update(store.id, form),
    onSuccess: () => { toast.success('Negozio aggiornato'); onSaved(); },
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Modal isOpen onClose={onClose} title="Modifica negozio">
      <div className="space-y-3">
        <Input label="Nome negozio" value={form.name} onChange={f('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Città" value={form.city} onChange={f('city')} />
          <Input label="Provincia" value={form.province} onChange={f('province')} helperText="es. PD" />
        </div>
        <Input label="Regione" value={form.region} onChange={f('region')} />
        <Input label="Indirizzo" value={form.address} onChange={f('address')} />
        <Input label="Telefono" value={form.phone} onChange={f('phone')} />
        <Input label="Email" type="email" value={form.email} onChange={f('email')} />
        <Button className="w-full" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Salva modifiche
        </Button>
      </div>
    </Modal>
  );
}
