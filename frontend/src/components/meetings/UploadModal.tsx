"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { meetingsApi, projectsApi, companiesApi, personsApi, tagsApi, Project, Company, Person, Tag } from "@/lib/api";
import { X, Upload, Loader2 } from "lucide-react";

interface FormData {
  title: string;
  date: string;
  module: string;
  project_id: string;
  company_id: string;
  person_id: string;
  tag_ids: string[];
  audio: FileList;
}

export function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState("");
  const [fileDate, setFileDate] = useState<string>("");

  useEffect(() => {
    Promise.all([
      projectsApi.list(),
      companiesApi.list(),
      personsApi.list(),
      tagsApi.list(),
    ]).then(([p, c, pe, t]) => {
      setProjects(p.data);
      setCompanies(c.data);
      setPersons(pe.data);
      setTags(t.data);
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const form = new FormData();
      form.append("title", data.title);
      form.append("date", data.date);
      form.append("module", data.module);
      if (data.project_id) form.append("project_id", data.project_id);
      if (data.company_id) form.append("company_id", data.company_id);
      if (data.person_id) form.append("person_id", data.person_id);
      if (data.tag_ids) form.append("tag_ids", Array.from(data.tag_ids).join(","));
      form.append("audio", data.audio[0]);
      await meetingsApi.upload(form);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "Error al cargar la reunión");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Nueva Reunión</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              {...register("title", { required: true })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ej: Reunión con Inversores Serie A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="datetime-local"
                {...register("date", { required: true })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">Se detecta automáticamente al seleccionar el audio</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo *</label>
              <select
                {...register("module", { required: true })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seleccionar...</option>
                <option value="investors">Inversionistas</option>
                <option value="clients">Clientes</option>
                <option value="suppliers">Proveedores</option>
                <option value="internal">Reunión Interna</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <select {...register("project_id")} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Ninguno</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select {...register("company_id")} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Ninguna</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona</label>
              <select {...register("person_id")} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Ninguna</option>
                {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
            <select multiple {...register("tag_ids")} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 h-20">
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audio *</label>
            <input
              type="file"
              accept=".mp3,.mp4,.wav,.m4a,.ogg,.webm,.flac,.aac"
              {...register("audio", { required: true })}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const d = new Date(file.lastModified);
                  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16);
                  setValue("date", local);
                  setFileDate(d.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" }));
                }
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200"
            />
            {fileDate && (
              <p className="mt-1 text-xs text-brand-600">📅 Fecha detectada del archivo: <strong>{fileDate}</strong></p>
            )}
            <p className="mt-1 text-xs text-gray-400">MP3, MP4, WAV, M4A, OGG, WEBM, FLAC, AAC — máx. 500 MB</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</> : <><Upload className="w-4 h-4 mr-2" />Cargar Reunión</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
