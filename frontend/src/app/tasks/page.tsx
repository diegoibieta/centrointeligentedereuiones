"use client";
import { useEffect, useState, useMemo } from "react";
import { meetingsApi, companiesApi, projectsApi, Meeting, Company, Project } from "@/lib/api";
import { CheckSquare, Square, AlertTriangle, Lightbulb, Filter, ExternalLink, Calendar, User, ChevronDown } from "lucide-react";
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
  completed?: boolean;
  taskIndex: number;
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
  companyName?: string;
  projectName?: string;
}

interface OppRow {
  description: string;
  potential?: string;
  action?: string;
  meetingId: string;
  meetingTitle: string;
  companyName?: string;
  projectName?: string;
}

type TabKey = "tareas" | "analisis";

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
  const [filterImpact, setFilterImpact] = useState("");
  const [filterType, setFilterType] = useState("riesgo");

  useEffect(() => {
    Promise.all([
      meetingsApi.list({ status: "completed" }),
      companiesApi.list(),
      projectsApi.list(),
    ]).then(async ([mList, cList, pList]) => {
      const details = await Promise.all(mList.data.items.map(m => meetingsApi.get(m.id).then(r => r.data)));
      setMeetings(details);
      setCompanies(cList.data);
      setProjects(pList.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allTasks = useMemo<TaskRow[]>(() => {
    return meetings.flatMap(m =>
      (m.tasks || []).map((t, idx) => ({
        description: t.description,
        responsible: t.responsible,
        priority: t.priority,
        deadline: t.deadline,
        completed: t.completed,
        taskIndex: idx,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.date,
        companyName: m.company?.name,
        projectName: m.project?.name,
      }))
    ).sort((a, b) => (PRIORITY_ORDER[a.priority || "baja"] ?? 2) - (PRIORITY_ORDER[b.priority || "baja"] ?? 2));
  }, [meetings]);

  const toggleTask = async (meetingId: string, taskIndex: number) => {
    const mtg = meetings.find(m => m.id === meetingId);
    if (!mtg || !mtg.tasks) return;
    const updatedTasks = mtg.tasks.map((t, i) =>
      i === taskIndex ? { ...t, completed: !t.completed } : t
    );
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, tasks: updatedTasks } : m));
    await meetingsApi.updateAnalysis(meetingId, { tasks: updatedTasks });
  };

  const allRisks = useMemo<RiskRow[]>(() => {
    return meetings.flatMap(m =>
      (m.risks || []).map(r => ({
        ...r,
        meetingId: m.id,
        meetingTitle: m.title,
        companyName: m.company?.name,
        projectName: m.project?.name,
      }))
    );
  }, [meetings]);

  const allOpps = useMemo<OppRow[]>(() => {
    return meetings.flatMap(m =>
      (m.opportunities || []).map(o => ({
        ...o,
        meetingId: m.id,
        meetingTitle: m.title,
        companyName: m.company?.name,
        projectName: m.project?.name,
      }))
    );
  }, [meetings]);

  const filteredProjects = useMemo(() => {
    if (!filterCompany) return projects;
    const company = companies.find(c => c.name === filterCompany);
    if (!company) return projects;
    return projects.filter(p => p.company_id === company.id || p.company?.id === company.id);
  }, [projects, companies, filterCompany]);

  const completedMeetings = useMemo(() => meetings.filter(m => {
    if (m.status !== "completed") return false;
    if (filterCompany && m.company?.name !== filterCompany) return false;
    if (filterProject && m.project?.name !== filterProject) return false;
    return true;
  }), [meetings, filterCompany, filterProject]);

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

  const filteredRisks = useMemo(() => {
    return allRisks.filter(r => {
      if (filterCompany && r.companyName !== filterCompany) return false;
      if (filterProject && r.projectName !== filterProject) return false;
      if (filterMeeting && r.meetingId !== filterMeeting) return false;
      if (filterImpact && r.impact !== filterImpact) return false;
      return true;
    });
  }, [allRisks, filterCompany, filterProject, filterMeeting, filterImpact]);

  const filteredOpps = useMemo(() => {
    return allOpps.filter(o => {
      if (filterCompany && o.companyName !== filterCompany) return false;
      if (filterProject && o.projectName !== filterProject) return false;
      if (filterMeeting && o.meetingId !== filterMeeting) return false;
      if (filterImpact && o.potential !== filterImpact) return false;
      return true;
    });
  }, [allOpps, filterCompany, filterProject, filterMeeting, filterImpact]);

  const uniqueResponsibles = Array.from(new Set(allTasks.map(t => t.responsible).filter((r): r is string => Boolean(r))));

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <CheckSquare className="w-5 h-5 text-brand-600" />
          Tareas y Analisis
        </h1>
        <p className="text-sm text-gray-500">Panel unificado de tareas, riesgos y oportunidades por reunion.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{allTasks.length}</div>
            <div className="text-xs text-gray-500">Tareas totales</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-blue-500">{allTasks.filter(t => !t.completed).length} en proceso</span>
              <span className="text-xs text-green-500">{allTasks.filter(t => t.completed).length} terminadas</span>
            </div>
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
          { key: "analisis", label: "Analisis de Riesgos y Oportunidades" },
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
            <select value={filterCompany} onChange={e => { setFilterCompany(e.target.value); setFilterProject(""); setFilterMeeting(""); }} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todas</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Proyecto</label>
            <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setFilterMeeting(""); }} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Todos</option>
              {filteredProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
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
          {tab === "analisis" && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Impacto / Potencial</label>
                <select value={filterImpact} onChange={e => setFilterImpact(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Todos</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Medio</option>
                  <option value="bajo">Bajo</option>
                </select>
              </div>
              <div />
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
              <div key={i} className={`bg-white rounded-xl border p-4 flex gap-4 items-start hover:border-brand-300 transition-colors ${t.completed ? "opacity-60" : ""}`}>
                <button type="button" onClick={() => toggleTask(t.meetingId, t.taskIndex)} className="mt-0.5 shrink-0">
                  {t.completed
                    ? <CheckSquare className="w-5 h-5 text-green-500" />
                    : <Square className="w-5 h-5 text-gray-300 hover:text-blue-400 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${t.completed ? "line-through text-gray-400" : "text-gray-900"}`}>{t.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {t.responsible && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.responsible}</span>
                    )}
                    {t.deadline && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.deadline}</span>
                    )}
                    {t.companyName && <span className="text-gray-400">{t.companyName}</span>}
                    {t.projectName && <span className="text-gray-400">· {t.projectName}</span>}
                  </div>
                  <Link href={`/meetings/${t.meetingId}`} className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {t.meetingTitle} · {new Date(t.meetingDate).toLocaleDateString("es-MX")}
                  </Link>
                </div>
                {t.priority && (
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${PRIORITY_COLORS[t.priority] || "bg-gray-100 text-gray-600"}`}>
                    {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                  </span>
                )}
              </div>
            ))
          )}
          {filteredTasks.length > 0 && (
            <p className="text-xs text-gray-400 text-right pt-1">{filteredTasks.length} tareas</p>
          )}
        </div>
      )}

      {tab === "analisis" && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b">
            {([
              { key: "riesgo", label: `Riesgos (${filteredRisks.length})`, color: "text-red-600" },
              { key: "oportunidad", label: `Oportunidades (${filteredOpps.length})`, color: "text-yellow-600" },
            ]).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  filterType === key ? `border-brand-600 ${color}` : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {filterType === "riesgo" && (
            <div className="bg-white rounded-xl border p-5">
              {filteredRisks.length === 0 ? (
                <p className="text-sm text-gray-400">No hay riesgos con los filtros seleccionados.</p>
              ) : (
                <div className="space-y-3">
                  {filteredRisks.map((r, i) => (
                    <div key={i} className="border-l-2 border-red-300 pl-4 py-1">
                      <p className="text-sm font-medium text-gray-800">{r.description}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {r.impact && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPACT_COLORS[r.impact] || "bg-gray-100 text-gray-600"}`}>
                            Impacto: {r.impact}
                          </span>
                        )}
                        {r.probability && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            Probabilidad: {r.probability}
                          </span>
                        )}
                      </div>
                      {r.mitigation && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          <span className="font-medium">Mitigacion:</span> {r.mitigation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {r.companyName && <span className="text-xs text-gray-400">{r.companyName}</span>}
                        <Link href={`/meetings/${r.meetingId}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                          <ExternalLink className="w-3 h-3" />{r.meetingTitle}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {filterType === "oportunidad" && (
            <div className="bg-white rounded-xl border p-5">
              {filteredOpps.length === 0 ? (
                <p className="text-sm text-gray-400">No hay oportunidades con los filtros seleccionados.</p>
              ) : (
                <div className="space-y-3">
                  {filteredOpps.map((o, i) => (
                    <div key={i} className="border-l-2 border-yellow-300 pl-4 py-1">
                      <p className="text-sm font-medium text-gray-800">{o.description}</p>
                      {o.potential && (
                        <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${IMPACT_COLORS[o.potential] || "bg-gray-100 text-gray-600"}`}>
                          Potencial: {o.potential}
                        </span>
                      )}
                      {o.action && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          <span className="font-medium">Accion:</span> {o.action}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {o.companyName && <span className="text-xs text-gray-400">{o.companyName}</span>}
                        <Link href={`/meetings/${o.meetingId}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                          <ExternalLink className="w-3 h-3" />{o.meetingTitle}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}