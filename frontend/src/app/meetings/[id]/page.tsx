"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { meetingsApi, Meeting } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatDate, formatDuration, MODULE_LABELS, MODULE_COLORS,
  STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS,
} from "@/lib/utils";
import {
  ArrowLeft, Calendar, Clock, Building2, User, FolderKanban,
  RefreshCw, Trash2, Globe, XCircle, RotateCcw, Pencil, Check, X, Plus,
} from "lucide-react";

const PROGRESS: Record<string, number> = {
  pending: 5, transcribing: 45, analyzing: 80, completed: 100, error: 0,
};
const PROGRESS_LABEL: Record<string, string> = {
  pending: "En cola...", transcribing: "Transcribiendo audio...",
  analyzing: "Analizando con Claude...", completed: "Completado", error: "Error",
};

type Agreement = { description: string; responsible?: string; deadline?: string };
type Task = { description: string; responsible?: string; priority?: string; deadline?: string };
type Risk = { description: string; impact?: string; probability?: string; mitigation?: string };
type Opportunity = { description: string; potential?: string; action?: string };

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("resumen");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editAgreements, setEditAgreements] = useState<Agreement[]>([]);
  const [editTasks, setEditTasks] = useState<Task[]>([]);
  const [editRisks, setEditRisks] = useState<Risk[]>([]);
  const [editOpportunities, setEditOpportunities] = useState<Opportunity[]>([]);

  const load = () => {
    meetingsApi.get(id).then(r => { setMeeting(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!meeting) return;
    if (["pending", "transcribing", "analyzing"].includes(meeting.status)) {
      const t = setTimeout(load, 3000);
      return () => clearTimeout(t);
    }
  }, [meeting]);

  const startEdit = (section: string) => {
    if (!meeting) return;
    setEditing(section);
    if (section === "resumen") setEditSummary(meeting.summary || "");
    if (section === "acuerdos") setEditAgreements(JSON.parse(JSON.stringify(meeting.agreements || [])));
    if (section === "tareas") setEditTasks(JSON.parse(JSON.stringify(meeting.tasks || [])));
    if (section === "riesgos") setEditRisks(JSON.parse(JSON.stringify(meeting.risks || [])));
    if (section === "oportunidades") setEditOpportunities(JSON.parse(JSON.stringify(meeting.opportunities || [])));
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!meeting) return;
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (editing === "resumen") body.summary = editSummary;
    if (editing === "acuerdos") body.agreements = editAgreements;
    if (editing === "tareas") body.tasks = editTasks;
    if (editing === "riesgos") body.risks = editRisks;
    if (editing === "oportunidades") body.opportunities = editOpportunities;
    await meetingsApi.updateAnalysis(id, body);
    setEditing(null);
    setSaving(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirm("Eliminar esta reunion?")) return;
    await meetingsApi.delete(id);
    router.push("/meetings");
  };

  const handleCancel = async () => {
    if (!confirm("Cancelar el procesamiento de esta reunion?")) return;
    await meetingsApi.cancel(id);
    load();
  };

  const handleRetry = async () => {
    await meetingsApi.retry(id);
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!meeting) return <div className="p-8 text-center text-gray-400">Reunion no encontrada.</div>;

  const isProcessing = ["pending", "transcribing", "analyzing"].includes(meeting.status);
  const isEditing = editing === tab;

  const tabs = meeting.status === "completed" ? [
    { key: "resumen", label: "Resumen" },
    { key: "acuerdos", label: "Acuerdos" },
    { key: "tareas", label: "Tareas" },
    { key: "riesgos", label: "Riesgos" },
    { key: "oportunidades", label: "Oportunidades" },
  ] : [];

  const inputCls = "w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const EditBar = () => (
    <div className="flex gap-2 mt-4 justify-end">
      <button type="button" onClick={cancelEdit}
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
        <X className="w-3.5 h-3.5" /> Cancelar
      </button>
      <button type="button" onClick={saveEdit} disabled={saving}
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
        <Check className="w-3.5 h-3.5" /> {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );

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
        <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
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

      {(isProcessing || meeting.status === "error") && (
        <div className={`rounded-xl p-4 mb-6 text-sm border ${
          meeting.status === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span className="font-medium">{PROGRESS_LABEL[meeting.status]}</span>
            </div>
            <div className="flex gap-2">
              {isProcessing && (
                <button type="button" onClick={handleCancel}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                  <XCircle className="w-3 h-3" /> Cancelar
                </button>
              )}
              {meeting.status === "error" && (
                <button type="button" onClick={handleRetry}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reintentar
                </button>
              )}
            </div>
          </div>
          {isProcessing && (
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${PROGRESS[meeting.status]}%` }} />
            </div>
          )}
          {meeting.status === "error" && meeting.error_message && (
            <p className="text-xs mt-1 text-red-500">{meeting.error_message}</p>
          )}
        </div>
      )}

      {meeting.status === "completed" && (
        <>
          <div className="flex gap-1 mb-4 border-b overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} type="button"
                onClick={() => { setTab(t.key); setEditing(null); }}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                  tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {tab === "resumen" && "Resumen ejecutivo"}
                {tab === "acuerdos" && "Acuerdos de la reunion"}
                {tab === "tareas" && "Tareas identificadas"}
                {tab === "riesgos" && "Riesgos identificados"}
                {tab === "oportunidades" && "Oportunidades identificadas"}
              </span>
              {!isEditing && (
                <button type="button" onClick={() => startEdit(tab)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors px-2 py-1 rounded hover:bg-brand-50">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              )}
            </div>

            {tab === "resumen" && (
              isEditing
                ? <>
                    <textarea value={editSummary} onChange={e => setEditSummary(e.target.value)}
                      rows={8} className={inputCls} />
                    <EditBar />
                  </>
                : <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{meeting.summary}</p>
            )}

            {tab === "acuerdos" && (
              isEditing
                ? <>
                    <div className="space-y-3">
                      {editAgreements.map((a, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                          <div className="flex items-center">
                            <span className="text-xs font-semibold text-gray-500">Acuerdo {i + 1}</span>
                            <button type="button" onClick={() => setEditAgreements(editAgreements.filter((_, j) => j !== i))}
                              className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <textarea value={a.description} rows={2} placeholder="Descripcion"
                            onChange={e => { const n = [...editAgreements]; n[i].description = e.target.value; setEditAgreements(n); }}
                            className={inputCls} />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={a.responsible || ""} placeholder="Responsable"
                              onChange={e => { const n = [...editAgreements]; n[i].responsible = e.target.value; setEditAgreements(n); }}
                              className={inputCls} />
                            <input value={a.deadline || ""} placeholder="Fecha limite"
                              onChange={e => { const n = [...editAgreements]; n[i].deadline = e.target.value; setEditAgreements(n); }}
                              className={inputCls} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setEditAgreements([...editAgreements, { description: "" }])}
                      className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                      <Plus className="w-4 h-4" /> Adicionar otro acuerdo
                    </button>
                    <EditBar />
                  </>
                : (meeting.agreements?.length ?? 0) === 0
                  ? <p className="text-sm text-gray-400 italic">No se determino la existencia de acuerdos en esta reunion.</p>
                  : <ul className="space-y-3">
                      {meeting.agreements!.map((a, i) => (
                        <li key={i} className="text-sm border-l-2 border-green-400 pl-3">
                          <p className="text-xs font-semibold text-gray-400 mb-0.5">Acuerdo {i + 1}</p>
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
              isEditing
                ? <>
                    <div className="space-y-3">
                      {editTasks.map((t, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                          <div className="flex items-center">
                            <span className="text-xs font-semibold text-gray-500">Tarea {i + 1}</span>
                            <button type="button" onClick={() => setEditTasks(editTasks.filter((_, j) => j !== i))}
                              className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <textarea value={t.description} rows={2} placeholder="Descripcion"
                            onChange={e => { const n = [...editTasks]; n[i].description = e.target.value; setEditTasks(n); }}
                            className={inputCls} />
                          <div className="grid grid-cols-3 gap-2">
                            <input value={t.responsible || ""} placeholder="Responsable"
                              onChange={e => { const n = [...editTasks]; n[i].responsible = e.target.value; setEditTasks(n); }}
                              className={inputCls} />
                            <select value={t.priority || ""} onChange={e => { const n = [...editTasks]; n[i].priority = e.target.value; setEditTasks(n); }}
                              className={inputCls}>
                              <option value="">Prioridad</option>
                              <option value="alta">Alta</option>
                              <option value="media">Media</option>
                              <option value="baja">Baja</option>
                            </select>
                            <input value={t.deadline || ""} placeholder="Fecha limite"
                              onChange={e => { const n = [...editTasks]; n[i].deadline = e.target.value; setEditTasks(n); }}
                              className={inputCls} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setEditTasks([...editTasks, { description: "" }])}
                      className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                      <Plus className="w-4 h-4" /> Adicionar otra tarea
                    </button>
                    <EditBar />
                  </>
                : (meeting.tasks?.length ?? 0) === 0
                  ? <p className="text-sm text-gray-400 italic">No se determino la existencia de tareas en esta reunion.</p>
                  : <ul className="space-y-3">
                      {meeting.tasks!.map((t, i) => (
                        <li key={i} className="text-sm border-l-2 border-blue-400 pl-3">
                          <p className="text-xs font-semibold text-gray-400 mb-0.5">Tarea {i + 1}</p>
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
              isEditing
                ? <>
                    <div className="space-y-3">
                      {editRisks.map((r, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                          <div className="flex items-center">
                            <span className="text-xs font-semibold text-gray-500">Riesgo {i + 1}</span>
                            <button type="button" onClick={() => setEditRisks(editRisks.filter((_, j) => j !== i))}
                              className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <textarea value={r.description} rows={2} placeholder="Descripcion"
                            onChange={e => { const n = [...editRisks]; n[i].description = e.target.value; setEditRisks(n); }}
                            className={inputCls} />
                          <div className="grid grid-cols-3 gap-2">
                            <select value={r.impact || ""} onChange={e => { const n = [...editRisks]; n[i].impact = e.target.value; setEditRisks(n); }}
                              className={inputCls}>
                              <option value="">Impacto</option>
                              <option value="alto">Alto</option>
                              <option value="medio">Medio</option>
                              <option value="bajo">Bajo</option>
                            </select>
                            <select value={r.probability || ""} onChange={e => { const n = [...editRisks]; n[i].probability = e.target.value; setEditRisks(n); }}
                              className={inputCls}>
                              <option value="">Probabilidad</option>
                              <option value="alta">Alta</option>
                              <option value="media">Media</option>
                              <option value="baja">Baja</option>
                            </select>
                            <input value={r.mitigation || ""} placeholder="Mitigacion"
                              onChange={e => { const n = [...editRisks]; n[i].mitigation = e.target.value; setEditRisks(n); }}
                              className={inputCls} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setEditRisks([...editRisks, { description: "" }])}
                      className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                      <Plus className="w-4 h-4" /> Adicionar otro riesgo
                    </button>
                    <EditBar />
                  </>
                : (meeting.risks?.length ?? 0) === 0
                  ? <p className="text-sm text-gray-400 italic">No se determino la existencia de riesgos en esta reunion.</p>
                  : <ul className="space-y-3">
                      {meeting.risks!.map((r, i) => (
                        <li key={i} className="text-sm border-l-2 border-red-400 pl-3">
                          <p className="text-xs font-semibold text-gray-400 mb-0.5">Riesgo {i + 1}</p>
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
              isEditing
                ? <>
                    <div className="space-y-3">
                      {editOpportunities.map((o, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                          <div className="flex items-center">
                            <span className="text-xs font-semibold text-gray-500">Oportunidad {i + 1}</span>
                            <button type="button" onClick={() => setEditOpportunities(editOpportunities.filter((_, j) => j !== i))}
                              className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <textarea value={o.description} rows={2} placeholder="Descripcion"
                            onChange={e => { const n = [...editOpportunities]; n[i].description = e.target.value; setEditOpportunities(n); }}
                            className={inputCls} />
                          <div className="grid grid-cols-2 gap-2">
                            <select value={o.potential || ""} onChange={e => { const n = [...editOpportunities]; n[i].potential = e.target.value; setEditOpportunities(n); }}
                              className={inputCls}>
                              <option value="">Potencial</option>
                              <option value="alto">Alto</option>
                              <option value="medio">Medio</option>
                              <option value="bajo">Bajo</option>
                            </select>
                            <input value={o.action || ""} placeholder="Accion recomendada"
                              onChange={e => { const n = [...editOpportunities]; n[i].action = e.target.value; setEditOpportunities(n); }}
                              className={inputCls} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setEditOpportunities([...editOpportunities, { description: "" }])}
                      className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                      <Plus className="w-4 h-4" /> Adicionar otra oportunidad
                    </button>
                    <EditBar />
                  </>
                : (meeting.opportunities?.length ?? 0) === 0
                  ? <p className="text-sm text-gray-400 italic">No se determino la existencia de oportunidades en esta reunion.</p>
                  : <ul className="space-y-3">
                      {meeting.opportunities!.map((o, i) => (
                        <li key={i} className="text-sm border-l-2 border-yellow-400 pl-3">
                          <p className="text-xs font-semibold text-gray-400 mb-0.5">Oportunidad {i + 1}</p>
                          <p className="text-gray-800">{o.description}</p>
                          {o.action && <p className="text-xs text-gray-500 mt-0.5">Accion: {o.action}</p>}
                        </li>
                      ))}
                    </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}