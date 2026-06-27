"use client";
import { useEffect, useState, useMemo } from "react";
import { meetingsApi, companiesApi, projectsApi, Meeting, Company, Project } from "@/lib/api";
import { CheckSquare, AlertTriangle, Lightbulb, Filter, ExternalLink, Calendar, User, ChevronDown } from "lucide-react";
import Link from "next/link";

const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 };
const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja: "bg-green-100 text-green-700 border-green-200",
};
const IMPACT_COLORS: Record<string, string> = {
  alto: "bg-red-100 text-red-700",
  medio: "bg-yellow-100 text-yellow-700",
  bajo: "bg-green-100 text-green-700",
};

interface TaskRow {
  description: string;
  responsible?: string;
  priority?: string;
  deadline?: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  companyName?: string;
  projectName?: string;
}

interface RiskRow {
  description: string;
  impact?: string;
  probability?: string;
  mitigation?: string;
  meetingId: string;
  meetingTitle: string;
}

interface OppRow {
  description: string;
  potential?: string;
  action?: string;
  meetingId: string;
  meetingTitle: string;
}

type TabKey = "tareas" | "matriz";

const IMPACT_VAL: Record<string, number> = { alto: 3, medio: 2, bajo: 1 };
const EFFORT_VAL: Record<string, number> = { alta: 3, media: 2, baja: 1 };

function QuadrantChart({ items }: { items: { label: string; x: number; y: number; color: string; type: string }[] }) {
  const W = 420, H = 320, PAD = 48;
  const cx = PAD + (W - PAD * 2) / 2;
  const cy = PAD + (H - PAD * 2) / 2;

  const colors: Record<string, string> = {
    "Alto / Baja": "#16a34a",
    "Alto / Alta": "#dc2626",
    "Bajo / Baja": "#6b7280",
    "Bajo / Alta": "#ca8a04",
  };

  function quadrantLabel(x: number, y: number): string {
    const highX = x >= 2.5;
    const highY = y >= 2.5;
    if (highX && !highY) return "Alto / Baja";
    if (highX && highY) return "Alto / Alta";
    if (!highX && !highY) return "Bajo / Baja";
    return "Bajo / Alta";
  }

  return (
    <div className="relative overflow-x-auto">
      <svg width={W} height={H} className="overflow-visible">
        <rect x={PAD} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#dcfce7" opacity="0.5" />
        <rect x={cx} y={PAD} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fee2e2" opacity="0.5" />
        <rect x={PAD} y={cy} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#f3f4f6" opacity="0.5" />
        <rect x={cx} y={cy} width={(W - PAD * 2) / 2} height={(H - PAD * 2) / 2} fill="#fef9c3" opacity="0.5" />
        <text x={PAD + 8} y={PAD + 16} fontSize="10" fill="#16a34a" fontWeight="600">GANANCIAS RAPIDAS</text>
        <text x={cx + 8} y={PAD + 16} fontSize="10" fill="#dc2626" fontWeight="600">PROYECTOS MAYORES</text>
        <text x={PAD + 8} y={cy + 16} fontSize="10" fill="#6b7280" fontWeight="600">RELLENO</text>
        <text x={cx + 8} y={cy + 16} fontSize="10" fill="#ca8a04" fontWeight="600">ESFUERZO DUDOSO</text>
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#9ca3af" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#9ca3af" strokeWidth="1" />
        <line x1={cx} y1={PAD} x2={cx} y2={H - PAD} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4,3" />
        <line x1={PAD} y1={cy} x2={W - PAD} y2={cy} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4,3" />
        <text x={(PAD + W - PAD) / 2} y={H - 8} fontSize="11" fill="#6b7280" textAnchor="middle">Bajo Esfuerzo --- Alto Esfuerzo</text>
        <text x={12} y={(PAD + H - PAD) / 2} fontSize="11" fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 12, ${(PAD + H - PAD) / 2})`}>Bajo Impacto --- Alto Impacto</text>
        {items.map((item, i) => {
          const px = PAD + ((item.x - 1) / 2) * (W - PAD * 2);
          const py = H - PAD - ((item.y - 1) / 2) * (H - PAD * 2);
          const ql = quadrantLabel(item.x, item.y);
          const dotColor = colors[ql] || "#6366f1";
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={7} fill={dotColor} opacity="0.85" />
              <title>{item.label} ({item.type})</title>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Riesgos</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Oportunidades</span>
        <div className="w-full grid grid-cols-2 gap-1 mt-1">
          <span className="text-green-700">Ganancias rapidas: alto impacto, bajo esfuerzo</span>
          <span className="text-red-700">Proyectos mayores: alto impacto, alto esfuerzo</span>
          <span className="text-gray-500">Relleno: bajo impacto, bajo esfuerzo</span>
          <span className="text-yellow-700">Esfuerzo dudoso: bajo impacto, alto esfuerzo</span>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("tareas");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterMeeting, setFilterMeeting] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterResponsible, setFilterResponsible] = useState("");

  useEffect(() => {
    Promise.all([
      meetingsApi.list({ status: "completed" }),
      companiesApi.list(),
      projectsApi.list(),
    ]).then(async ([mList, cList, pList]) => {
      const details = await Promise.all(mList.data.map(m => meetingsApi.get(m.id).then(r => r.data)));
      setMeetings(details);
      setCompanies(cList.data);
      setProjects(pList.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allTasks = useMemo<TaskRow[]>(() => {
    return meetings.flatMap(m =>
      (m.tasks || []).map(t => ({
        description: t.description,
        responsible: t.responsible,
        priority: t.priority,
        deadline: t.deadline,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.date,
        companyName: m.company?.name,
        projectName: m.project?.name,
      }))
    ).sort((a, b) => (PRIORITY_ORDER[a.priority || "baja"] ?? 2) - (PRIORITY_ORDER[b.priority || "baja"] ?? 2));
  }, [meetings]);

  const allRisks = useMemo<RiskRow[]>(() => {
    return meetings.flatMap(m =>
      (m.risks || []).map(r => ({ ...r, meetingId: m.id, meetingTitle: m.title }))
    );
  }, [meetings]);

  const allOpps = useMemo<OppRow[]>(() => {
    return meetings.flatMap(m =>
      (m.opportunities || []).map(o => ({ ...o, meetingId: m.id, meetingTitle: m.title }))
    );
  }, [meetings]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (filterCompany && t.companyName !== filterCompany) return false;
      if (filterProject && t.projectName !== filterProject) return false;
      if (filterMeeting && t.meetingId !== filterMeeting) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterResponsible && !(t.responsible || "").toLowerCase().includes(filterResponsible.toLowerCase())) return false;
      return true;
    });
  }, [allTasks, filterCompany, filterProject, filterMeeting, filterPriority, filterResponsible]);

  const matrixItems = useMemo(() => {
    const risks = allRisks
      .filter(r => !filterMeeting || r.meetingId === filterMeeting)
      .map(r => ({
        label: r.description,
        type: "Riesgo",
        x: EFFORT_VAL[r.probability || "media"] ?? 2,
        y: IMPACT_VAL[r.impact || "medio"] ?? 2,
        color: "#ef4444",
      }));
    const opps = allOpps
      .filter(o => !filterMeeting || o.meetingId === filterMeeting)
      .map(o => ({
        label: o.description,
        type: "Oportunidad",
        x: 2,
        y: IMPACT_VAL[o.potential || "medio"] ?? 2,
        color: "#6366f1",
      }));
    return [...risks, ...opps];
  }, [allRisks, allOpps, filterMeeting]);

  const completedMeetings = meetings.filter(m => m.status === "completed");
  const uniqueResponsibles = [...new Set(allTasks.map(t => t.responsible).filter(Boolean))] as string[];

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando tareas...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <CheckSquare className="w-5 h-5 text-brand-600" />
          Panel de Tareas y Analisis
        </h1>
        <p className="text-sm text-gray-500">Tareas pendientes, riesgos y oportunidades extraidos de tus reuniones.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{allTasks.length}</div>
            <div className="text-xs text-gray-500">Tareas totales</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{allRisks.length}</div>
            <div className="text-xs text-gray-500">Riesgos identificados</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-yellow-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{allOpps.length}</div>
            <div className="text-xs text-gray-500">Oportunidades</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "tareas", label: "Tareas" },
          { key: "matriz", label: "Matriz Impacto / Esfuerzo" },
        ] as { key: TabKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Proyecto</label>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todos</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Reunion</label>
            <select value={filterMeeting} onChange={e => setFilterMeeting(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todas</option>
              {completedMeetings.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          {tab === "tareas" && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prioridad</label>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Responsable</label>
                <select value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Todos</option>
                  {uniqueResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {tab === "tareas" && (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
              No hay tareas con los filtros seleccionados.
            </div>
          ) : (
            filteredTasks.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 flex gap-4 items-start hover:border-brand-300 transition-colors">
                <div className="mt-0.5">
                  <CheckSquare className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{t.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {t.responsible && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {t.responsible}
                      </span>
                    )}
                    {t.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t.deadline}
                      </span>
                    )}
                    {t.companyName && <span className="text-gray-400">{t.companyName}</span>}
                    {t.projectName && <span className="text-gray-400">- {t.projectName}</span>}
                  </div>
                  <Link href={`/meetings/${t.meetingId}`} className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {t.meetingTitle} - {new Date(t.meetingDate).toLocaleDateString("es-MX")}
                  </Link>
                </div>
                <div className="shrink-0">
                  {t.priority && (
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${PRIORITY_COLORS[t.priority] || "bg-gray-100 text-gray-600"}`}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          {filteredTasks.length > 0 && (
            <p className="text-xs text-gray-400 text-right pt-1">{filteredTasks.length} tareas</p>
          )}
        </div>
      )}

      {tab === "matriz" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Matriz de Impacto vs. Esfuerzo
            </h3>
            <p className="text-xs text-gray-400 mb-4">Riesgos y oportunidades posicionados segun su impacto potencial y el esfuerzo requerido para gestionarlos.</p>
            {matrixItems.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">No hay riesgos u oportunidades con los filtros seleccionados.</div>
            ) : (
              <QuadrantChart items={matrixItems} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-sm text-red-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Riesgos ({allRisks.filter(r => !filterMeeting || r.meetingId === filterMeeting).length})
              </h4>
              <div className="space-y-2">
                {allRisks.filter(r => !filterMeeting || r.meetingId === filterMeeting).map((r, i) => (
                  <div key={i} className="border-l-2 border-red-300 pl-3 py-1">
                    <p className="text-sm text-gray-800">{r.description}</p>
                    <div className="flex gap-2 mt-1">
                      {r.impact && <span className={`text-xs px-1.5 py-0.5 rounded ${IMPACT_COLORS[r.impact] || "bg-gray-100 text-gray-600"}`}>Impacto: {r.impact}</span>}
                      {r.probability && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Prob: {r.probability}</span>}
                    </div>
                    {r.mitigation && <p className="text-xs text-gray-500 mt-1">Mitigacion: {r.mitigation}</p>}
                    <Link href={`/meetings/${r.meetingId}`} className="text-xs text-brand-600 hover:underline">{r.meetingTitle}</Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h4 className="font-medium text-sm text-yellow-700 flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4" />
                Oportunidades ({allOpps.filter(o => !filterMeeting || o.meetingId === filterMeeting).length})
              </h4>
              <div className="space-y-2">
                {allOpps.filter(o => !filterMeeting || o.meetingId === filterMeeting).map((o, i) => (
                  <div key={i} className="border-l-2 border-yellow-300 pl-3 py-1">
                    <p className="text-sm text-gray-800">{o.description}</p>
                    {o.potential && <span className={`text-xs px-1.5 py-0.5 rounded ${IMPACT_COLORS[o.potential] || "bg-gray-100 text-gray-600"}`}>Potencial: {o.potential}</span>}
                    {o.action && <p className="text-xs text-gray-500 mt-1">Accion: {o.action}</p>}
                    <Link href={`/meetings/${o.meetingId}`} className="text-xs text-brand-600 hover:underline">{o.meetingTitle}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}