import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { Home, Search, Upload, Download, X } from 'lucide-react';
import type { Unit, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

export function UnitList() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [showUpload, setShowUpload] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role.name === 'administrator';

  useEffect(() => {
    loadUnits();
  }, [pagination.page]);

  const loadUnits = async () => {
    try {
      const res = await apiGet<PaginatedResponse<Unit>>(`/units?page=${pagination.page}&limit=60`);
      setUnits(res.data);
      setPagination(prev => ({ ...prev, total: res.pagination.total, totalPages: res.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setUploadResult('El archivo debe tener al menos una fila de datos.'); return; }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      }).filter(r => r['numero'] || r['unit_number'] || r['numero_unidad']);

      setCsvData(rows);
      setShowUpload(true);
      setUploadResult(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUploadAll = async () => {
    setUploading(true);
    setUploadResult(null);
    let created = 0;
    let errors = 0;

    for (const row of csvData) {
      const unitNumber = row['numero'] || row['unit_number'] || row['numero_unidad'] || '';
      const monthlyFee = parseFloat(row['cuota'] || row['monthly_fee'] || row['cuota_mensual'] || '0') || 0;
      const unitType = row['tipo'] || row['unit_type'] || 'house';
      const area = parseFloat(row['area'] || row['area_m2'] || '0') || null;

      try {
        await apiPost('/units', {
          unitNumber,
          unitType: unitType === 'casa' ? 'house' : unitType,
          monthlyFee: monthlyFee || 1500,
          areaM2: area,
          address: row['direccion'] || row['address'] || null,
        });
        created++;
      } catch {
        errors++;
      }
    }

    setUploadResult(`Se crearon ${created} unidades. ${errors > 0 ? `${errors} errores (posibles duplicados).` : ''}`);
    setUploading(false);
    setCsvData([]);
    loadUnits();
  };

  const downloadTemplate = () => {
    const csv = 'numero,tipo,cuota_mensual,area_m2,direccion\nC-01,casa,1500,120,Lote 1\nC-02,casa,1500,150,Lote 2\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_unidades.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUnits = units.filter(u =>
    u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
    u.owner?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.owner?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    u.resident?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.resident?.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const unitTypeLabel = (type: string) =>
    es.units.types[type as keyof typeof es.units.types] || type;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.units.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} unidades registradas</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm">
              <Download size={16} />
              Plantilla CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
              <Upload size={16} />
              Importar CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, propietario o residente..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.unitNumber}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.unitType}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.owner}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.resident}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.monthlyFee}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/units/${unit.id}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                      <Home size={16} />
                      {unit.unitNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{unitTypeLabel(unit.unitType)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {unit.owner ? `${unit.owner.firstName} ${unit.owner.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {unit.resident ? `${unit.resident.firstName} ${unit.resident.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    Q{Number(unit.monthlyFee).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      unit.isOccupied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {unit.isOccupied ? es.units.occupied : es.units.vacant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
        )}
      </div>

      {/* CSV Upload Modal */}
      {showUpload && csvData.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Vista Previa de Importación</h2>
              <button onClick={() => { setShowUpload(false); setCsvData([]); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <p className="text-sm text-gray-600 mb-3">{csvData.length} unidades encontradas en el archivo:</p>

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Número</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Tipo</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Cuota</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Área</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvData.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{row['numero'] || row['unit_number'] || row['numero_unidad']}</td>
                      <td className="px-3 py-2">{row['tipo'] || row['unit_type'] || 'casa'}</td>
                      <td className="px-3 py-2 text-right">Q{row['cuota'] || row['monthly_fee'] || row['cuota_mensual'] || '1500'}</td>
                      <td className="px-3 py-2 text-right">{row['area'] || row['area_m2'] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 20 && <div className="text-center py-2 text-xs text-gray-500">...y {csvData.length - 20} más</div>}
            </div>

            {uploadResult && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">{uploadResult}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowUpload(false); setCsvData([]); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
              <button onClick={handleUploadAll} disabled={uploading} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                {uploading ? 'Importando...' : `Importar ${csvData.length} Unidades`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
