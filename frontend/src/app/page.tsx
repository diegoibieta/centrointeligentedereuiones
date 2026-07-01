"use client";
import { useEffect, useState } from "react";
import { meetingsApi, MeetingListItem, MeetingModule } from "@/lib/api";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/utils";
import { Brain, TrendingUp, CheckSquare, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const MODULES: MeetingModule[] = ["investors", "clients", "suppliers", "internal"];

export default function Dashboard() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingsApi.list({ page: 1, page_size: 100 }).then(r => {
      setMeetings(r.data.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const completed = meetings.filter(m => m.status === "completed");
  const byModule = MODULES.map(mod => ({
    mod,
    count: meetings.filter(m => m.module === mod).length,
  }));

  const recent = meetings.slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-7 h-7 text-brand-600" />
          Centro de Inteligencia de Reuniones
        </h1>
        <p className="text-gray-500 text-sm mt-1">Memoria organizacional estratégica</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {byModule.map(({ mod, count }) => (
          <Link key={mod} href={`/meetings?module=${mod}`}>
            <div className="bg-white rounded-xl border p-4 hover:border-brand-500 transition-colors">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500 mt-1">{MODULE_LABELS[mod]}</div>
              <Badge className={`mt-2 ${MODULE_COLORS[mod]}`}>{MODULE_LABELS[mod]}</Badge>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckSquare className="w-5 h-5" />
            <span className="font-medium text-sm">Total de reuniones</span>
          </div>
          <div className="text-3xl font-bold">{meetings.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium text-sm">Analizadas</span>
          </div>
          <div className="text-3xl font-bold">{completed.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <Lightbulb className="w-5 h-5" />
            <span className="font-medium text-sm">En proceso</span>
          </div>
          <div className="text-3xl font-bold">{meetings.filter(m => ["pending","transcribing","analyzing"].includes(m.status)).length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Reuniones Recientes</h2>
          <Link href="/meetings" className="text-sm text-brand-600 hover:underline">Ver todas</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No hay reuniones aún.</p>
            <Link href="/meetings" className="text-brand-600 hover:underline text-sm">Cargar primera reunión →</Link>
          </div>
        ) : (
          <div className="divide-y">
            {recent.map(m => (
              <Link key={m.id} href={`/meetings/${m.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString("es-MX")}</p>
                </div>
                <Badge className={MODULE_COLORS[m.module]}>{MODULE_LABELS[m.module]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}