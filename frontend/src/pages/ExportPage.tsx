import { useState } from 'react';
import { exportApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(new Date(2024, i, 1), 'MMMM', { locale: it }),
  }));

  const handleExcel = async () => {
    setLoadingExcel(true);
    try {
      const blob = await exportApi.excel(parseInt(year), parseInt(month));
      downloadBlob(blob, `orario_${year}_${month}.xlsx`);
      toast.success('File Excel scaricato');
    } catch {
      toast.error('Errore durante il download');
    } finally {
      setLoadingExcel(false);
    }
  };

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      const blob = await exportApi.pdf(parseInt(year), parseInt(month));
      downloadBlob(blob, `orario_${year}_${month}.pdf`);
      toast.success('File PDF scaricato');
    } catch {
      toast.error('Errore durante il download');
    } finally {
      setLoadingPdf(false);
    }
  };

  const selectedMonthLabel = months.find((m) => m.value === month)?.label ?? '';

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900">Esporta orari</h1>

      <Card>
        <CardContent>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Seleziona periodo</p>
              <div className="flex gap-3">
                <Select value={month} onChange={(e) => setMonth(e.target.value)} className="flex-1 capitalize">
                  {months.map((m) => (
                    <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
                  ))}
                </Select>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <p className="text-xs text-gray-400 mt-1 capitalize">
                Orario selezionato: {selectedMonthLabel} {year}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExcel}
                disabled={loadingExcel}
                className="flex items-center gap-4 p-4 border-2 border-dashed border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 text-left"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Excel (.xlsx)</p>
                  <p className="text-xs text-gray-500">Foglio con tutti i turni</p>
                </div>
                {loadingExcel && <div className="ml-auto w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />}
              </button>

              <button
                onClick={handlePdf}
                disabled={loadingPdf}
                className="flex items-center gap-4 p-4 border-2 border-dashed border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 text-left"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">PDF</p>
                  <p className="text-xs text-gray-500">Formato stampabile A4</p>
                </div>
                {loadingPdf && <div className="ml-auto w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-medium text-gray-700 mb-2">Note sull'esportazione</h3>
          <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
            <li>Il file include tutti i dipendenti del negozio per il mese selezionato</li>
            <li>Le ferie, malattie e permessi sono indicati con abbreviazioni</li>
            <li>I weekend sono evidenziati in colore diverso</li>
            <li>Il totale ore per dipendente è calcolato automaticamente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
