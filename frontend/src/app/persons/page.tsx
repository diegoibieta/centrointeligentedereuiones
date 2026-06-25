"use client";
import { useEffect, useState } from "react";
import { personsApi, companiesApi, Person, Company } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, User, Pencil, Trash2, Check, X } from "lucide-react";

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");

  const load = () => personsApi.list().then(r => setPersons(r.data));
  useEffect(() => {
    load();
    companiesApi.list().then(r => setCompanies(r.data));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await personsApi.create({ name, role: role || undefined, email: email || undefined, company_id: companyId || undefined });
    setName(""); setRole(""); setEmail(""); setCompanyId("");
    load();
  };

  const startEdit = (p: Person) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditRole(p.role || "");
    setEditEmail(p.email || "");
    setEditCompanyId(p.company_id || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await personsApi.update(id, { name: editName.trim(), role: editRole || undefined, email: editEmail || undefined, company_id: editCompanyId || undefined });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta persona?")) return;
    await personsApi.delete(id);
    load();
  };

  const companyName = (id?: string) => companies.find(c => c.id === id)?.name;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <User className="w-5 h-5 text-brand-600" />Personas
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Persona</h2>
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Cargo (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">Empresa (opcional)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Persona</Button>
      </form>

      <div className="space-y-2">
        {persons.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            {editId === p.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre completo" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="Cargo (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Empresa (opcional)</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(p.id)} className="flex items-center gap-1 px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"><Check className="w-3.5 h-3.5" />Guardar</button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" />Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">{[p.role, p.email, companyName(p.company_id)].filter(Boolean).join(" · ")}</p>
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
