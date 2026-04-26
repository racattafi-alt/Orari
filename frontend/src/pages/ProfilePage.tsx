import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const changePwdMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      toast.success('Password aggiornata');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Errore';
      toast.error(msg);
    },
  });

  const canChange = currentPwd && newPwd.length >= 8 && newPwd === confirmPwd;

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>

      <Card>
        <CardHeader><CardTitle>Informazioni account</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">{ROLE_LABELS[user?.role ?? 'EMPLOYEE']}</Badge>
                {user?.canClockIn && <Badge variant="success">Timbratura GPS</Badge>}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {user?.phone && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Telefono</span>
                <span className="font-medium text-gray-800">{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Negozio</span>
              <span className="font-medium text-gray-800">{user?.store?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Città</span>
              <span className="font-medium text-gray-800">{user?.store?.city ?? '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cambia password</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input label="Password attuale" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            <Input label="Nuova password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} helperText="Minimo 8 caratteri" />
            <Input
              label="Conferma nuova password"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              error={confirmPwd && newPwd !== confirmPwd ? 'Le password non coincidono' : undefined}
            />
            <Button
              className="w-full"
              onClick={() => changePwdMutation.mutate()}
              loading={changePwdMutation.isPending}
              disabled={!canChange}
            >
              Aggiorna password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Button variant="danger" className="w-full" onClick={logout}>
            Esci dall'account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
