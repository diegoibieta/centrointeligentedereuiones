"use client";

import { useState, useEffect, useCallback } from "react";
import { schedulingApi, CalendarEvent, CalendarEventCreateInput } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Plus, Trash2, ExternalLink, Video, RefreshCw, X } from "lucide-react";

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CalendarEventCreateInput>({
    title: "",
    start: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    duration_minutes: 60,
    description: "",
    attendees: [],
    location: "",
    add_meet_link: true,
  });
  const [attendeeInput, setAttendeeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addAttendee() {
    const email = attendeeInput.trim();
    if (!email || form.attendees?.includes(email)) return;
    setForm(f => ({ ...f, attendees: [...(f.attendees ?? []), email] }));
    setAttendeeInput("");
  }

  function removeAttendee(email: string) {
    setForm(f => ({ ...f, attendees: (f.attendees ?? []).filter(e => e !== email) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      await schedulingApi.createEvent({
        ...form,
        start: new Date(form.start).toISOString(),
      });
      onCreated();
      onClose();
    } catch {
      setError("No se pudo crear el evento. Verifica la configuración de Google Calendar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            Nuevo evento en Google Calendar
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              placeholder="Reunión de equipo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Inicio</label>
              <input
                type="datetime-local"
                value={form.start}
                onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duración (min)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Lugar / Ubicación</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              placeholder="Sala de conferencias / URL"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Invitados</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={attendeeInput}
                onChange={e => setAttendeeInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="correo@ejemplo.com"
              />
              <button
                type="button"
                onClick={addAttendee}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Agregar
              </button>
            </div>
            {(form.attendees ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.attendees?.map(email => (
                  <span key={email} className="flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2 py-0.5 rounded-full">
                    {email}
                    <button type="button" onClick={() => removeAttendee(email)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.add_meet_link}
              onChange={e => setForm(f => ({ ...f, add_meet_link: e.target.checked }))}
              className="accent-brand-500"
            />
            <span className="text-sm text-gray-300">Agregar enlace de Google Meet</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-60"
            >
              {saving ? "Creando…" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventCard({ event, onDeleted }: { event: CalendarEvent; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${event.title}"?`)) return;
    setDeleting(true);
    try {
      await schedulingApi.deleteEvent(event.id);
      onDeleted();
    } catch {
      alert("No se pudo eliminar el evento.");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-white text-sm leading-snug">{event.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          {event.html_link && (
            <a
              href={event.html_link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-brand-400 rounded-lg hover:bg-gray-700"
              title="Abrir en Google Calendar"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            title="Eliminar evento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-white font-medium">
        {fmtDate(event.start)}
        {event.end && ` → ${fmtDate(event.end)}`}
      </p>

      {event.location && (
        <p className="text-xs text-gray-400">{event.location}</p>
      )}

      {event.meet_link && (
        <a
          href={event.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300"
        >
          <Video className="w-3.5 h-3.5" />
          Unirse a Google Meet
        </a>
      )}

      {event.attendees.length > 0 && (
        <p className="text-xs text-gray-500">
          {event.attendees.length} invitado{event.attendees.length !== 1 ? "s" : ""}:{" "}
          {event.attendees.map(a => a.email).join(", ")}
        </p>
      )}

      {event.description && (
        <p className="text-xs text-gray-400 line-clamp-2">{event.description}</p>
      )}
    </div>
  );
}

export default function SchedulingPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await schedulingApi.listEvents({ max_results: 50 });
      setEvents(res.data);
    } catch {
      setError("No se pudo cargar el calendario. Verifica que Google Calendar esté configurado en el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-400" />
            Agenda / Google Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Próximos eventos del calendario</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo evento
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-yellow-300 text-sm">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay eventos próximos en el calendario.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} onDeleted={load} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}