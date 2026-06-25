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
  RefreshCw, Trash2, Globe,
} from "lucide-react";

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("resumen");

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
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
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
    </div>
  );
}