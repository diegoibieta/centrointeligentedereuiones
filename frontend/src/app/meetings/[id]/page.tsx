"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { meetingsApi, projectsApi, companiesApi, personsApi, tagsApi, Meeting, Project, Company, Person, Tag } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatDate, formatDuration, MODULE_LABELS, MODULE_COLORS,
  STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS,
} from "@/lib/utils";
import {
  ArrowLeft, Calendar, Clock, Building2, User, FolderKanban,
  RefreshCw, Trash2, Globe, Pencil, X, Check, Loader2,
} from "lucide-react";

function EditModal({ meeting, onClose, onSaved }: { meeting: Meeting; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(meeting.date.slice(0, 16));
  const [module, setModule] = useState(meeting.module);
  const [companyId, setCompanyId] = useState(meeting.company?.id || "");
  const [projectId, setProjectId] = useState(meeting.project?.id || "");
  const [personId, setPersonId] = useState(meeting.person?.id || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(meeting.tags.map(t => t.id));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([companiesApi.list(), projectsApi.list(), personsApi.list(), tagsApi.list()])
      .then(([c, p, pe, t]) => {
        setCompanies(c.data); setProjects(p.data); setPersons(pe.data); setTags(t.data);
      });
  }, []);

  const filteredProjects = companyId ? projects.filter(p => p.company_id === companyId) : projects;
  const filteredPersons = projectId
    ? (projects.find(p => p.id === projectId)?.persons || []).map(x => persons.find(pe => pe.id === x.id)).filter(Boolean) as Person[]
    : companyId ? persons.filter(pe => pe.company_id === companyId) : persons;

  const handleCompanyChange = (id: string) => { setCompanyId(id); setProjectId(""); setPersonId(""); };
  const handleProjectChange = (id: string) => {
    setProjectId(id); setPersonId("");
    if (id) { const proj = projects.find(p => p.id === id); if (proj?.company_id && !companyId) setCompanyId(proj.company_id); }
  };
  const toggleTag = (id: string) => setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const form = new FormData();
    form.append("title", title.trim());
    form.append("date", date);
    form.append("module", module);
    if (companyId) form.append("company_id", companyId);
    if (projectId) form.append("project_id", projectId);
    if (personId) form.append("person_id", personId);
    form.append("tag_ids", selectedTagIds.join(","));
    await meetingsApi.update(meeting.id, form);
    setSaving(false);
    onSaved();
    onClose();
  };

  const selectCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Editar Reunion</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={selectCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modulo *</label>
              <select value={module} onChange={e => setModule(e.target.value as any)} className={selectCls}>
                <option value="investors">Inversionistas</option>
                <option value="clients">Clientes</option>
                <option value="suppliers">Proveedores</option>
                <option value="internal">Reunion Interna</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contexto</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select value={companyId} onChange={e => handleCompanyChange(e.target.value)} className={selectCls}>
                <option value="">Sin empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <select value={projectId} onChange={e => handleProjectChange(e.target.value)} className={selectCls}>
                <option value="">Sin proyecto</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona</label>
              <select value={personId} onChange={e => setPersonId(e.target.value)} className={selectCls}>
                <option value="">Sin persona</option>
                {filteredPersons.map(p => <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ""}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${selectedTagIds.includes(t.id) ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
                  style={selectedTagIds.includes(t.id) ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Check className="w-4 h-4 mr-1" />Guardar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("resumen");
  const [showEdit, setShowEdit] = useState(false);

  const load = () => {
    meetingsApi.get(id).then(r => {
      setMeeting(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!meeting) return;
    if (["pending", "transcribing", "analyzing"].includes(meeting.status)) {
      const t = setTimeout(load, 3000);
      return () => clearTimeout(t);
    }
  }, [meeting]);

  const handleDelete = async () => {
    if (!confirm("Eliminar esta reunion?")) return;
    await meetingsApi.delete(id);
    router.push("/meetings");
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!meeting) return <div className="p-8 text-center text-gray-400">Reunion no encontrada.</div>;

  const isProcessing = ["pending", "transcribing", "analyzing"].includes(meeting.status);

  const tabs = meeting.status === "completed" ? [
    { key: "resumen", label: "Resumen", show: !!meeting.summary },
    { key: "acuerdos", label: "Acuerdos", show: (meeting.agreements?.length ?? 0) > 0 },
    { key: "tareas", label: "Tareas", show: (meeting.tasks?.length ?? 0) > 0 },
    { key: "riesgos", label: "Riesgos", show: (meeting.risks?.length ?? 0) > 0 },
    { key: "oportunidades", label: "Oportunidades", show: (meeting.opportunities?.length ?? 0) > 0 },
  ].filter(t => t.show) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" />Volver
          </button>
          <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={MODULE_COLORS[meeting.module]}>{MODULE_LABELS[meeting.module]}</Badge>
            <Badge className={STATUS_COLORS[meeting.status]}>
              {isProcessing && <RefreshCw className="w-3 h-3 mr-1 animate-spin inline" />}
              {STATUS_LABELS[meeting.status]}
            </Badge>
            {meeting.original_language && (
              <Badge className="bg-gray-100 text-gray-600">
                <Globe className="w-3 h-3 mr-1 inline" />
                {meeting.original_language.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}><Pencil className="w-4 h-4" /></Button>
          <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />{formatDate(meeting.date)}
        </div>
        {meeting.duration_seconds && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />{formatDuration(meeting.duration_seconds)}
          </div>
        )}
        {meeting.project && (
          <div className="flex items-center gap-2 text-gray-600">
            <FolderKanban className="w-4 h-4" />{meeting.project.name}
          </div>
        )}
        {meeting.company && (
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="w-4 h-4" />{meeting.company.name}
          </div>
        )}
        {meeting.person && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />{meeting.person.name}
            {meeting.person.role && <span className="text-gray-400"> · {meeting.person.role}</span>}
          </div>
        )}
      </div>

      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-5">
          {meeting.tags.map(tag => (
            <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-blue-700 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {meeting.status === "transcribing" ? "Transcribiendo audio..." :
           meeting.status === "analyzing" ? "Analizando con Claude..." :
           "En cola para procesamiento..."}
        </div>
      )}

      {meeting.status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          Error: {meeting.error_message}
        </div>
      )}

      {meeting.status === "completed" && (
        <>
          <div className="flex gap-1 mb-4 border-b overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                  tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5">
            {tab === "resumen" && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{meeting.summary}</p>
            )}
            {tab === "acuerdos" && (
              <ul className="space-y-3">
                {meeting.agreements!.map((a, i) => (
                  <li key={i} className="text-sm border-l-2 border-green-400 pl-3">
                    <p className="text-gray-800">{a.description}</p>
                    {(a.responsible || a.deadline) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.responsible && `Responsable: ${a.responsible}`}
                        {a.responsible && a.deadline && " · "}
                        {a.deadline && `Fecha: ${a.deadline}`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {tab === "tareas" && (
              <ul className="space-y-3">
                {meeting.tasks!.map((t, i) => (
                  <li key={i} className="text-sm border-l-2 border-blue-400 pl-3">
                    <p className="text-gray-800">{t.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.priority && <span className={`font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>Prioridad: {t.priority}</span>}
                      {t.responsible && ` · Responsable: ${t.responsible}`}
                      {t.deadline && ` · Fecha: ${t.deadline}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {tab === "riesgos" && (
              <ul className="space-y-3">
                {meeting.risks!.map((r, i) => (
                  <li key={i} className="text-sm border-l-2 border-red-400 pl-3">
                    <p className="text-gray-800">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.impact && `Impacto: ${r.impact}`}
                      {r.probability && ` · Probabilidad: ${r.probability}`}
                    </p>
                    {r.mitigation && <p className="text-xs text-gray-500 mt-0.5">Mitigacion: {r.mitigation}</p>}
                  </li>
                ))}
              </ul>
            )}
            {tab === "oportunidades" && (
              <ul className="space-y-3">
                {meeting.opportunities!.map((o, i) => (
                  <li key={i} className="text-sm border-l-2 border-yellow-400 pl-3">
                    <p className="text-gray-800">{o.description}</p>
                    {o.action && <p className="text-xs text-gray-500 mt-0.5">Accion: {o.action}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {showEdit && <EditModal meeting={meeting} onClose={() => setShowEdit(false)} onSaved={load} />}
    </div>
  );
}