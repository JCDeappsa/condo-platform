import { useState, useEffect } from 'react';
import { apiGet, apiUpload } from '../../lib/api';
import { es } from '../../i18n/es';
import { FileText, X, Download, Upload } from 'lucide-react';
import type { Document as DocType, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

export function DocumentLibrary() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'other', visibility: 'all_roles', file: null as File | null,
  });

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      const res = await apiGet<PaginatedResponse<DocType>>('/documents?limit=100');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('visibility', form.visibility);
      await apiUpload('/documents', formData);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'other', visibility: 'all_roles', file: null });
      loadDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = categoryFilter
    ? documents.filter(d => d.category === categoryFilter)
    : documents;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.documents.title}</h1>
            <p className="text-sm text-gray-500">{documents.length} documentos</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => { setError(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Upload size={18} />
            {es.documents.upload}
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3 mb-4">
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">{es.documents.category}: Todas</option>
          {Object.entries(es.documents.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{es.common.noData}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText size={20} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {es.documents.categories[doc.category as keyof typeof es.documents.categories] || doc.category}
                    </span>
                    <span>{formatSize(doc.fileSizeBytes)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString('es-GT')}</span>
                    <span>{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                  </div>
                </div>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm ml-4 flex-shrink-0"
              >
                <Download size={16} />
                {es.documents.download}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{es.documents.upload}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input type="text" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description}</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.documents.category}</label>
                  <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(es.documents.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.documents.visibility}</label>
                  <select value={form.visibility} onChange={e => setForm(prev => ({ ...prev, visibility: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(es.documents.visibilities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo *</label>
                <input type="file" required onChange={e => setForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting || !form.file} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.documents.upload}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
