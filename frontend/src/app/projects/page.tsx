"use client";
import { useEffect, useState } from "react";
import { projectsApi, companiesApi, personsApi, Project, Company, Person } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, FolderKanban, Pencil, Trash2, Check, X, Building2, User } from "lucide-react";

function MultiSelect({ options, selected, onChange }: {
  options: { id: string; name: string; role?: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
      {options.length === 0 && <p className="text-xs text-gray-400 px-1">No hay personas registradas</p>}
      {options.map(o => (
        <label key={o.id} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={() => toggle(o.id)}
            className="accent-brand-600"
          />
          <span className="text-gray-800">{o.name}</span>
          {o.role && <span className="text-xs text-gray-400">{o.role}</span>}
        </label>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

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
    setAdding(true);
    await projectsApi.create({ name: name.trim(), description: description.trim() || undefined, company_id: companyId || undefined, person_ids: personIds });
    setName(""); setDescription(""); setCompanyId(""); setPersonIds([]);
    setAdding(false);
    load();
  };

  const startEdit = (p: Project) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || "");
    setEditCompanyId(p.company_id || "");
    setEditPersonIds(p.persons.map(x => x.id));
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await projectsApi.update(id, { name: editName.trim(), description: editDescription.trim() || undefined, company_id: editCompanyId || undefined, person_ids: editPersonIds });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este proyecto?")) return;
    await projectsApi.delete(id);
    load();
  };

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-brand-600" />Proyectos
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
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
          <label className="text-xs text-gray-500 mb-1 block">Participantes del proyecto</label>
          <MultiSelect options={persons} selected={personIds} onChange={setPersonIds} />
        </div>
        <Button type="submit" size="sm" disabled={adding}><Plus className="w-4 h-4 mr-1" />Crear Proyecto</Button>
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
                  <MultiSelect options={persons} selected={editPersonIds} onChange={setEditPersonIds} />
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
                    {p.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />{p.company.name}
                      </span>
                    )}
                    {p.persons.length > 0 && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{p.persons.map(x => x.name).join(", ")}
                      </span>
                    )}
                  </div>
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