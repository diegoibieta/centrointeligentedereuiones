"use client";
import { useState, FormEvent } from "react";
import { meetingsApi, MeetingListItem } from "@/lib/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { Button } from "@/components/ui/Button";
import { Search, Loader2, Brain } from "lucide-react";
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const r = await meetingsApi.search(query.trim());
      setResults(r.data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-indigo-600" />Busqueda Semantica
        </h1>
        <p className="text-sm text-gray-500">Busca por concepto o tema — Claude encuentra las reuniones mas relevantes.</p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej: compromisos con inversores, problemas de entrega..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </form>
      {searched && !loading && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{results.length === 0 ? "No se encontraron reuniones relevantes." : results.length + " reunion(es) encontrada(s) ordenadas por relevancia"}</p>
          <div className="grid gap-4">{results.map(m => <MeetingCard key={m.id} meeting={m} />)}</div>
        </div>
      )}
    </div>
  );
}
