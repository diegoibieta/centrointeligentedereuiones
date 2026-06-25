"use client";
import { useEffect, useState } from "react";
import { projectsApi, Project } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, FolderKanban } from "lucide-react";
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const load = () => projectsApi.list().then(r => setProjects(r.data));
  useEffect(() => { load(); }, []);
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await projectsApi.create({ name: name.trim(), description: description.trim() || undefined });
    setName(""); setDescription("");
    load();
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><FolderKanban className="w-5 h-5 text-indigo-600" />Proyectos</h1>
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nuevo Proyecto</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripcion (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Crear Proyecto</Button>
      </form>
      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            <p className="font-medium text-gray-900">{p.name}</p>
            {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
