import { useState } from 'react';
import { es } from '../../i18n/es';
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: number;
  description: string;
  status: 'ok' | 'issue' | '';
  notes: string;
}

export function InspectionChecklist() {
  const [area, setArea] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: 1, description: '', status: '', notes: '' },
  ]);
  const [overallNotes, setOverallNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  let nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;

  const addItem = () => {
    setItems(prev => [...prev, { id: nextId, description: '', status: '', notes: '' }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: number, field: keyof ChecklistItem, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const areas = Object.entries(es.inspection.areas);

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ClipboardCheck className="text-green-500 mx-auto mb-3" size={48} />
          <h2 className="text-xl font-semibold text-gray-700">Funcionalidad proximamente</h2>
          <p className="text-gray-500 mt-2">La inspeccion se guardara cuando el modulo este disponible.</p>
          <button onClick={() => setSubmitted(false)} className="mt-4 text-blue-600 hover:text-blue-800 text-sm">{es.common.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.inspection.title}</h1>
          <p className="text-sm text-gray-500">Formulario de inspeccion de areas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area a Inspeccionar</label>
            <select required value={area} onChange={e => setArea(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Seleccione un area</option>
              {areas.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.date}</label>
            <input type="date" required value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Items de Inspeccion</h3>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
              <Plus size={16} />
              Agregar Item
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="border border-gray-100 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium w-6">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder="Descripcion del item..."
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 pl-8">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`status-${item.id}`}
                      value="ok"
                      checked={item.status === 'ok'}
                      onChange={() => updateItem(item.id, 'status', 'ok')}
                      className="text-green-600"
                    />
                    <span className="text-green-700">OK</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`status-${item.id}`}
                      value="issue"
                      checked={item.status === 'issue'}
                      onChange={() => updateItem(item.id, 'status', 'issue')}
                      className="text-red-600"
                    />
                    <span className="text-red-700">Problema</span>
                  </label>
                </div>
                {item.status === 'issue' && (
                  <div className="pl-8">
                    <textarea
                      rows={2}
                      placeholder="Describa el problema..."
                      value={item.notes}
                      onChange={e => updateItem(item.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas Generales</label>
          <textarea rows={3} value={overallNotes} onChange={e => setOverallNotes(e.target.value)} placeholder="Observaciones generales de la inspeccion..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Enviar Inspeccion
        </button>
      </form>
    </div>
  );
}
