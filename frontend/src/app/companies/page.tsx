"use client";
import { useEffect, useState } from "react";
import { companiesApi, Company } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Plus, Briefcase } from "lucide-react";
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const load = () => companiesApi.list().then(r => setCompanies(r.data));
  useEffect(() => { load(); }, []);
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await companiesApi.create({ name: name.trim(), sector: sector.trim() || undefined });
    setName(""); setSector("");
    load();
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600" />Empresas</h1>
      <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-700">Nueva Empresa</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la empresa" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input value={sector} onChange={e => setSector(e.target.value)} placeholder="Sector (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" />Agregar Empresa</Button>
      </form>
      <div className="space-y-2">
        {companies.map(c => (
          <div key={c.id} className="bg-white rounded-xl border p-4">
            <p className="font-medium text-gray-900">{c.name}</p>
            {c.sector && <p className="text-sm text-gray-500">{c.sector}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
