"use client";
import { useEffect, useState } from "react";
import { companiesApi, Company } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, Briefcase, Pencil, Trash2, Check, X } from "lucide-react";

export default function CompaniesPage() {
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
    setName(""); setSector("");
    load();
  };

  const startEdit = (c: Company) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSector(c.sector || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await companiesApi.update(id, { name: editName.trim(), sector: editSector.trim() || undefined });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta empresa?")) return;
    await companiesApi.delete(id);
    load();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-brand-600" />Empresas
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Empresa</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la empresa" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <input value={sector} onChange={e => setSector(e.target.value)} placeholder="Sector (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Empresa</Button>
      </form>

      <div className="space-y-2">
        {companies.map(c => (
          <div key={c.id} className="bg-white rounded-xl border p-4">
            {editId === c.id ? (
              <div className="space-y-2">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input value={editSector} onChange={e => setEditSector(e.target.value)} placeholder="Sector (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
                  <button onClick={() => startEdit(c)} title="Editar" className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
