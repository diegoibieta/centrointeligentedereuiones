"use client";
import { useEffect, useState } from "react";
import { projectsApi, Project } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, FolderKanban, Pencil, Trash2, Check, X } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = () => projectsApi.list().then(r => setProjects(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    await projectsApi.create({ name: name.trim(), description: description.trim() || undefined });
    setName(""); setDescription("");
    setAdding(false);
    load();
  };

  const startEdit = (p: Project) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await projectsApi.update(id, { name: editName.trim(), description: editDescription.trim() || undefined });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await projectsApi.delete(id);
    load();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-brand-600" />Proyectos
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nuevo Proyecto</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <Button type="submit" size="sm" disabled={adding}><Plus className="w-4 h-4 mr-1" />Crear Proyecto</Button>
      </form>

      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            {editId === p.id ? (
              <div className="space-y-2">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Descripción (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="flex items-center gap-1 px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"><Check className="w-3.5 h-3.5" />Guardar</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" />Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
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
