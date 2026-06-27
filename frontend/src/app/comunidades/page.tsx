"use client";
import { useEffect, useState } from "react";
import { companiesApi, projectsApi, personsApi, tagsApi, Company, Project, Person, Tag } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, Briefcase, FolderKanban, User, Tag as TagIcon, Pencil, Trash2, Check, X, Building2, Users } from "lucide-react";

const PRESET_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function MultiSelect({ options, selected, onChange, emptyMsg }: {
  options: { id: string; name: string; role?: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyMsg: string;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
      {options.length === 0 && <p className="text-xs text-gray-400 px-1">{emptyMsg}</p>}
      {options.map(o => (
        <label key={o.id} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 text-sm">
          <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="accent-brand-600" />
          <span className="text-gray-800">{o.name}</span>
          {o.role && <span className="text-xs text-gray-400">{o.role}</span>}
        </label>
      ))}
    </div>
  );
}

function EmpresasTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");

  const load = () => companiesApi.list().then(r => setCompanies(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await companiesApi.create({ name: name.trim(), sector: sector.trim() || undefined });
    setName(""); setSector(""); load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await companiesApi.update(id, { name: editName.trim(), sector: editSector.trim() || undefined });
    setEditId(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta empresa?")) return;
    await companiesApi.delete(id); load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Empresa</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la empresa" className={inputCls} />
        <input value={sector} onChange={e => setSector(e.target.value)} placeholder="Sector (opcional)" className={inputCls} />
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Empresa</Button>
      </form>
      <div className="space-y-2">
        {companies.map(c => (
          <div key={c.id} className="bg-white rounded-xl border p-4">
            {editId === c.id ? (
              <div className="space-y-2">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                <input value={editSector} onChange={e => setEditSector(e.target.value)} placeholder="Sector (opcional)" className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(c.id)} className="flex items-center gap-1 px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"><Check className="w-3.5 h-3.5" />Guardar</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" />Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.sector && <p className="text-sm text-gray-500">{c.sector}</p>}
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <button onClick={() => { setEditId(c.id); setEditName(c.name); setEditSector(c.sector || ""); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProyectosTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editPersonIds, setEditPersonIds] = useState<string[]>([]);

  const load = () => projectsApi.list().then(r => setProjects(r.data));
  useEffect(() => {
    load();
    companiesApi.list().then(r => setCompanies(r.data));
    personsApi.list().then(r => setPersons(r.data));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await projectsApi.create({ name: name.trim(), description: description.trim() || undefined, company_id: companyId || undefined, person_ids: personIds });
    setName(""); setDescription(""); setCompanyId(""); setPersonIds([]); load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await projectsApi.update(id, { name: editName.trim(), description: editDescription.trim() || undefined, company_id: editCompanyId || undefined, person_ids: editPersonIds });
    setEditId(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este proyecto?")) return;
    await projectsApi.delete(id); load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nuevo Proyecto</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" className={inputCls} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripcion (opcional)" className={inputCls} />
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
          <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={inputCls}>
            <option value="">Sin empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Participantes</label>
          <MultiSelect options={persons} selected={personIds} onChange={setPersonIds} emptyMsg="No hay personas registradas" />
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Crear Proyecto</Button>
      </form>
      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            {editId === p.id ? (
              <div className="space-y-2">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                <input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Descripcion (opcional)" className={inputCls} />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
                  <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)} className={inputCls}>
                    <option value="">Sin empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Participantes</label>
                  <MultiSelect options={persons} selected={editPersonIds} onChange={setEditPersonIds} emptyMsg="No hay personas registradas" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="flex items-center gap-1 px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"><Check className="w-3.5 h-3.5" />Guardar</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" />Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {p.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{p.company.name}</span>}
                    {(p.persons || []).length > 0 && <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.persons.map(x => x.name).join(", ")}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditId(p.id); setEditName(p.name); setEditDescription(p.description || ""); setEditCompanyId(p.company_id || ""); setEditPersonIds((p.persons || []).map(x => x.id)); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function PersonasTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editProjectIds, setEditProjectIds] = useState<string[]>([]);

  const load = () => personsApi.list().then(r => setPersons(r.data));
  useEffect(() => {
    load();
    companiesApi.list().then(r => setCompanies(r.data));
    projectsApi.list().then(r => setProjects(r.data));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await personsApi.create({ name, role: role || undefined, email: email || undefined, company_id: companyId || undefined, project_ids: projectIds });
    setName(""); setRole(""); setEmail(""); setCompanyId(""); setProjectIds([]); load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await personsApi.update(id, { name: editName.trim(), role: editRole || undefined, email: editEmail || undefined, company_id: editCompanyId || undefined, project_ids: editProjectIds });
    setEditId(null); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta persona?")) return;
    await personsApi.delete(id); load();
  };

  const companyName = (id?: string) => companies.find(c => c.id === id)?.name;

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Persona</h2>
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className={inputCls} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Cargo (opcional)" className={inputCls} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (opcional)" className={inputCls} />
          <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={inputCls}>
            <option value="">Empresa (opcional)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Proyectos en los que participa</label>
          <MultiSelect options={projects} selected={projectIds} onChange={setProjectIds} emptyMsg="No hay proyectos registrados" />
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Persona</Button>
      </form>
      <div className="space-y-2">
        {persons.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            {editId === p.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre completo" className={inputCls} />
                  <input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="Cargo (opcional)" className={inputCls} />
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email (opcional)" className={inputCls} />
                  <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)} className={inputCls}>
                    <option value="">Empresa (opcional)</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Proyectos en los que participa</label>
                  <MultiSelect options={projects} selected={editProjectIds} onChange={setEditProjectIds} emptyMsg="No hay proyectos registrados" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="flex items-center gap-1 px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"><Check className="w-3.5 h-3.5" />Guardar</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" />Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    {p.role && <span>{p.role}</span>}
                    {p.email && <span>{p.email}</span>}
                    {p.company_id && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{companyName(p.company_id)}</span>}
                  </div>
                  {(p.projects || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(p.projects || []).map(proj => (
                        <span key={proj.id} className="flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">
                          <FolderKanban className="w-3 h-3" />{proj.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditId(p.id); setEditName(p.name); setEditRole(p.role || ""); setEditEmail(p.email || ""); setEditCompanyId(p.company_id || ""); setEditProjectIds((p.projects || []).map(x => x.id)); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EtiquetasTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  const load = () => tagsApi.list().then(r => setTags(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await tagsApi.create({ name: name.trim(), color });
    setName(""); load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Etiqueta</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la etiqueta" className={inputCls} />
        <div className="flex gap-2">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-gray-700" : "border-transparent"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Crear Etiqueta</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <span key={t.id} className="px-3 py-1.5 rounded-full text-sm text-white font-medium" style={{ backgroundColor: t.color }}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { key: "empresas", label: "Empresas", icon: Briefcase },
  { key: "proyectos", label: "Proyectos", icon: FolderKanban },
  { key: "personas", label: "Personas", icon: User },
  { key: "etiquetas", label: "Etiquetas", icon: TagIcon },
];

export default function ComunidadesPage() {
  const [tab, setTab] = useState("empresas");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-600" />Comunidades
      </h1>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {tab === "empresas" && <EmpresasTab />}
      {tab === "proyectos" && <ProyectosTab />}
      {tab === "personas" && <PersonasTab />}
      {tab === "etiquetas" && <EtiquetasTab />}
    </div>
  );
}