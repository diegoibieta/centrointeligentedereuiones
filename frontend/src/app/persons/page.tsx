"use client";
import { useEffect, useState } from "react";
import { personsApi, companiesApi, Person, Company } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, User } from "lucide-react";
export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const load = () => personsApi.list().then(r => setPersons(r.data));
  useEffect(() => { load(); companiesApi.list().then(r => setCompanies(r.data)); }, []);
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await personsApi.create({ name, role: role || undefined, email: email || undefined, company_id: companyId || undefined });
    setName(""); setRole(""); setEmail(""); setCompanyId("");
    load();
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" />Personas</h1>
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Persona</h2>
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Cargo (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (opcional)" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Empresa (opcional)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Persona</Button>
      </form>
      <div className="space-y-2">
        {persons.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-sm text-gray-500">{[p.role, p.email].filter(Boolean).join(" · ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
