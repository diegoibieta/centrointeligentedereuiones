import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(new Date(date), "d 'de' MMMM yyyy", { locale: es });
}

export function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const MODULE_LABELS: Record<string, string> = {
  investors: "Inversionistas",
  clients: "Clientes",
  suppliers: "Proveedores",
  internal: "Reunion Interna",
};

export const MODULE_COLORS: Record<string, string> = {
  investors: "bg-purple-100 text-purple-800",
  clients: "bg-blue-100 text-blue-800",
  suppliers: "bg-orange-100 text-orange-800",
  internal: "bg-green-100 text-green-800",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "En cola",
  transcribing: "Transcribiendo",
  analyzing: "Analizando",
  completed: "Completado",
  error: "Error",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  transcribing: "bg-yellow-100 text-yellow-700",
  analyzing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  alta: "text-red-600",
  media: "text-yellow-600",
  baja: "text-green-600",
};