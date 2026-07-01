"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { meetingsApi, companiesApi, projectsApi, MeetingListItem, MeetingModule, Company, Project } from "@/lib/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { UploadModal } from "@/components/meetings/UploadModal";
import { Button } from "@/components/ui/Button";
import { Plus, RefreshCw, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  investors: "Inversionistas",
  clients: "Clientes",
  suppliers: "Proveedores",
  internal: "Internas",
};

const PAGE_SIZE = 12;

function MeetingsContent() {
  const searchParams = useSearchParams();
  const module = searchParams.get("module") as MeetingModule | null;

  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const [filterCompany, setFilterCompany] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const load = (p = page) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, page_size: PAGE_SIZE };
    if (module) params.module = module;
    Promise.all([
      meetingsApi.list(params),
      companies.length === 0 ? companiesApi.list() : Promise.resolve(null),
      projects.length === 0 ? projectsApi.list() : Promise.resolve(null),
    ]).then(([mRes, cRes, pRes]) => {
      setMeetings(mRes.data.items);
      setTotal(mRes.data.total);
      setPages(mRes.data.pages);
      if (cRes) setCompanies(cRes.data);
      if (pRes) setProjects(pRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

useEffect(() => { setPage(1); load(1); }, [module]);
useEffect(() => { if (page !== 1) load(page); }, [page]);

  useEffect(() => {
    const pending = meetings.some(m => ["pending", "transcribing", "analyzing"].includes(m.status));
    if (!pending) return;
    const t = setTimeout(() => load(page), 5000);
    return () => clearTimeout(t);
  }, [meetings]);

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      if (filterCompany && m.company?.name !== filterCompany) return false;
      if (filterProject && m.project?.name !== filterProject) return false;
      if (filterDateFrom && m.date < filterDateFrom) return false;
      if (filterDateTo && m.date > filterDateTo + "T23:59:59") return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inSummary = (m.summary || "").toLowerCase().includes(q);
        const inProject = (m.project?.name || "").toLowerCase().includes(q);
        const inPerson = (m.person?.name || "").toLowerCase().includes(q);
        if (!inTitle && !inSummary && !inProject && !inPerson) return false;
      }
      return true;
    });
  }, [meetings, filterCompany, filterProject, filterDateFrom, filterDateTo, filterSearch]);

  const hasFilters = filterCompany || filterProject || filterDateFrom || filterDateTo || filterSearch;

  function clearFilters() {
    setFilterCompany("");
    setFilterProject("");
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
          <Button variant="secondary" size="sm" onClick={() => load(page)} title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-1" />Nueva Reunion
          </Button>
        </div>
      </div>

      {/* Filter bar */}
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
              placeholder="Título, resumen, proyecto, persona…"
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
            <select
              value={filterCompany}
              onChange={e => { setFilterCompany(e.target.value); setFilterProject(""); }}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Proyecto</label>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todos</option>
              {projects
  .filter(p => !filterCompany || p.company?.name === filterCompany)
  .map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-1">
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

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {hasFilters
            ? `${filtered.length} de ${meetings.length} en esta página (${total} total)`
            : `${total} reuniones · página ${page} de ${pages}`}
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

      {/* Pagination */}
      {!loading && pages > 1 && !hasFilters && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => load(page)} />}
    </div>
  );
}

export default function MeetingsPage() {
  return <Suspense><MeetingsContent /></Suspense>;
}