"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { meetingsApi, companiesApi, MeetingListItem, MeetingModule, Company } from "@/lib/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { UploadModal } from "@/components/meetings/UploadModal";
import { Button } from "@/components/ui/Button";
import { Plus, RefreshCw, Filter, X } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  investors: "Inversionistas",
  clients: "Clientes",
  suppliers: "Proveedores",
  internal: "Internas",
};

function MeetingsContent() {
  const searchParams = useSearchParams();
  const module = searchParams.get("module") as MeetingModule | null;

  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (module) params.module = module;
    Promise.all([
      meetingsApi.list(params),
      companies.length === 0 ? companiesApi.list() : Promise.resolve(null),
    ]).then(([mRes, cRes]) => {
      setMeetings(mRes.data);
      if (cRes) setCompanies(cRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [module]);

  useEffect(() => {
    const pending = meetings.some(m => ["pending", "transcribing", "analyzing"].includes(m.status));
    if (!pending) return;
    const t = setTimeout(load, 5000);
    return () => clearTimeout(t);
  }, [meetings]);

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      if (filterCompany && m.company?.name !== filterCompany) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterDateFrom && m.date < filterDateFrom) return false;
      if (filterDateTo && m.date > filterDateTo + "T23:59:59") return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inSummary = (m.summary || "").toLowerCase().includes(q);
        const inProject = (m.project?.name || "").toLowerCase().includes(q);
        if (!inTitle && !inSummary && !inProject) return false;
      }
      return true;
    });
  }, [meetings, filterCompany, filterStatus, filterDateFrom, filterDateTo, filterSearch]);

  const hasFilters = filterCompany || filterStatus || filterDateFrom || filterDateTo || filterSearch;

  function clearFilters() {
    setFilterCompany("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSearch("");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {module ? MODULE_LABELS[module] ?? module : "Todas las Reuniones"}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load} title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-1" />Nueva Reunion
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter className="w-4 h-4" />
          Filtros
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Buscar</label>
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Título, resumen, proyecto…"
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Estado</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todos</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
              <option value="transcribing">Transcribiendo</option>
              <option value="analyzing">Analizando</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Desde</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full text-sm border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full text-sm border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} de {meetings.length} reuniones
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {hasFilters ? (
            <p>No hay reuniones con los filtros seleccionados.</p>
          ) : (
            <>
              <p className="mb-3">No hay reuniones en este módulo.</p>
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="w-4 h-4 mr-1" />Cargar primera reunion
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={load} />}
    </div>
  );
}

export default function MeetingsPage() {
  return <Suspense><MeetingsContent /></Suspense>;
}