"use client";
import { useEffect, useState } from "react";
import { tagsApi, Tag } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, Tag as TagIcon } from "lucide-react";
const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const load = () => tagsApi.list().then(r => setTags(r.data));
  useEffect(() => { load(); }, []);
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await tagsApi.create({ name: name.trim(), color });
    setName("");
    load();
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><TagIcon className="w-5 h-5 text-indigo-600" />Etiquetas</h1>
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Etiqueta</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la etiqueta" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className={"w-7 h-7 rounded-full border-2 transition-transform " + (color === c ? "scale-125 border-gray-700" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Crear Etiqueta</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {tags.map(t => <span key={t.id} className="px-3 py-1.5 rounded-full text-sm text-white font-medium" style={{ backgroundColor: t.color }}>{t.name}</span>)}
      </div>
    </div>
  );
}
