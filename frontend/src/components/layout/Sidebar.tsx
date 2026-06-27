"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Brain, Users, Briefcase, Truck, Building2, Search,
  FolderKanban, Tag, User, LayoutDashboard, CheckSquare,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tareas y Analisis", icon: CheckSquare },
  { href: "/meetings", label: "Todas las Reuniones", icon: Brain },
  { href: "/meetings?module=investors", label: "Inversionistas", icon: TrendingUp },
  { href: "/meetings?module=clients", label: "Clientes", icon: Users },
  { href: "/meetings?module=suppliers", label: "Proveedores", icon: Truck },
  { href: "/meetings?module=internal", label: "Internas", icon: Building2 },
  { href: "/search", label: "Busqueda Semantica", icon: Search },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/companies", label: "Empresas", icon: Briefcase },
  { href: "/persons", label: "Personas", icon: User },
  { href: "/tags", label: "Etiquetas", icon: Tag },
];

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="text-brand-500 w-6 h-6" />
          <span className="font-bold text-sm leading-tight">Centro de Inteligencia<br />de Reuniones</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href.split("?")[0] && (!href.includes("?") || typeof window !== "undefined" && window.location.href.includes(href.split("?")[1] || ""));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}