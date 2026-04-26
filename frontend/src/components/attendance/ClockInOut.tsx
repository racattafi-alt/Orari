import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Attendance } from '@/types';

export function ClockInOut() {
  const qc = useQueryClient();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: today, isLoading } = useQuery<Attendance | null>({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.today(),
    refetchInterval: 30000,
  });

  const getPosition = (): Promise<GeolocationPosition> =>
    new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
    );

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const pos = await getPosition();
      return attendanceApi.clockIn(pos.coords.latitude, pos.coords.longitude);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      toast.success('Entrata registrata!');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Errore timbratura';
      if (msg.includes('denied')) toast.error('Geolocalizzazione negata. Abilita il GPS.');
      else toast.error(msg);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const pos = await getPosition();
      return attendanceApi.clockOut(pos.coords.latitude, pos.coords.longitude);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      toast.success('Uscita registrata!');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Errore timbratura';
      toast.error(msg);
    },
  });

  const hasClockedIn = !!today?.clockIn;
  const hasClockedOut = !!today?.clockOut;

  function getWorkedTime(): string {
    if (!today?.clockIn) return '—';
    const start = new Date(today.clockIn);
    const end = today.clockOut ? new Date(today.clockOut) : now;
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <Card>
      <CardContent>
        <div className="text-center space-y-4">
          <div>
            <p className="text-3xl font-mono font-bold text-gray-900">
              {format(now, 'HH:mm:ss')}
            </p>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {format(now, 'EEEE d MMMM yyyy', { locale: it })}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>GPS richiesto per timbratura</span>
          </div>

          {!isLoading && (
            <div className="space-y-3">
              {hasClockedIn && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Entrata</span>
                    <span className="font-medium">{format(new Date(today!.clockIn!), 'HH:mm')}</span>
                  </div>
                  {hasClockedOut ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uscita</span>
                      <span className="font-medium">{format(new Date(today!.clockOut!), 'HH:mm')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ore lavorate</span>
                      </div>
                      <span className="font-mono font-medium text-primary-600">{getWorkedTime()}</span>
                    </div>
                  )}
                  {!today?.clockInValid && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Posizione fuori zona autorizzata</span>
                    </div>
                  )}
                </div>
              )}

              {!hasClockedIn && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => clockInMutation.mutate()}
                  loading={clockInMutation.isPending}
                >
                  <Clock className="w-5 h-5" />
                  Timbra Entrata
                </Button>
              )}

              {hasClockedIn && !hasClockedOut && (
                <Button
                  variant="danger"
                  className="w-full"
                  size="lg"
                  onClick={() => clockOutMutation.mutate()}
                  loading={clockOutMutation.isPending}
                >
                  <Clock className="w-5 h-5" />
                  Timbra Uscita
                </Button>
              )}

              {hasClockedOut && (
                <Badge variant="success" className="text-sm py-1.5 px-4">
                  Turno completato · {today?.workedMinutes
                    ? `${Math.floor(today.workedMinutes / 60)}h ${today.workedMinutes % 60}m`
                    : getWorkedTime()
                  }
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
