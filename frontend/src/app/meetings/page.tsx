"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { meetingsApi, MeetingListItem, MeetingModule } from "@/lib/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { UploadModal } from "@/components/meetings/UploadModal";
import { Button } from "@/components/ui/Button";
import { Plus, RefreshCw } from "lucide-react";
function MeetingsContent() {
  const searchParams = useSearchParams();
  const module = searchParams.get("module") as MeetingModule | null;
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (module) params.module = module;
    meetingsApi.list(params).then(r => { setMeetings(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [module]);
  useEffect(() => {
    const pending = meetings.some(m => ["pending", "transcribing", "analyzing"].includes(m.status));
    if (!pending) return;
    const t = setTimeout(load, 5000);
    return () => clearTimeout(t);
  }, [meetings]);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {module ? { investors: "Inversionistas", clients: "Clientes", suppliers: "Proveedores", internal: "Reuniones Internas" }[module] : "Todas las Reuniones"}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={() => setShowUpload(true)}><Plus className="w-4 h-4 mr-1" />Nueva Reunion</Button>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-3">No hay reuniones en este modulo.</p>
          <Button onClick={() => setShowUpload(true)}><Plus className="w-4 h-4 mr-1" />Cargar primera reunion</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={load} />}
    </div>
  );
}
export default function MeetingsPage() {
  return <Suspense><MeetingsContent /></Suspense>;
}
