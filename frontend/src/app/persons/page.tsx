"use client";
import { useEffect, useState } from "react";
import { personsApi, companiesApi, projectsApi, Person, Company, Project } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, User, Pencil, Trash2, Check, X, Building2, FolderKanban } from "lucide-react";

function MultiSelect({ options, selected, onChange }: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
      {options.length === 0 && <p className="text-xs text-gray-400 px-1">No hay proyectos registrados</p>}
      {options.map(o => (
        <label key={o.id} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={() => toggle(o.id)}
            className="accent-brand-600"
          />
          <span className="text-gray-800">{o.name}</span>
        </label>
      ))}
    </div>
  );
}

export default function PersonsPage() {
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
    setName(""); setRole(""); setEmail(""); setCompanyId(""); setProjectIds([]);
    load();
  };

  const startEdit = (p: Person) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditRole(p.role || "");
    setEditEmail(p.email || "");
    setEditCompanyId(p.company_id || "");
    setEditProjectIds(p.projects.map(x => x.id));
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await personsApi.update(id, { name: editName.trim(), role: editRole || undefined, email: editEmail || undefined, company_id: editCompanyId || undefined, project_ids: editProjectIds });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta persona?")) return;
    await personsApi.delete(id);
    load();
  };

  const companyName = (id?: string) => companies.find(c => c.id === id)?.name;
  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <User className="w-5 h-5 text-brand-600" />Personas
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
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
          <MultiSelect options={projects} selected={projectIds} onChange={setProjectIds} />
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
                  <MultiSelect options={projects} selected={editProjectIds} onChange={setEditProjectIds} />
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
                  {p.projects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.projects.map(proj => (
                        <span key={proj.id} className="flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">
                          <FolderKanban className="w-3 h-3" />{proj.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(p)} title="Editar" className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}