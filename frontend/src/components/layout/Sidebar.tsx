"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain, Users, Briefcase, Truck, Building2, Search, FolderKanban, Tag, User, LayoutDashboard } from "lucide-react";
const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Todas las Reuniones", icon: Brain },
  { href: "/meetings?module=investors", label: "Inversionistas", icon: Briefcase },
  { href: "/meetings?module=clients", label: "Clientes", icon: Users },
  { href: "/meetings?module=suppliers", label: "Proveedores", icon: Truck },
  { href: "/meetings?module=internal", label: "Internas", icon: Building2 },
  { href: "/search", label: "Busqueda Semantica", icon: Search },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/companies", label: "Empresas", icon: Briefcase },
  { href: "/persons", label: "Personas", icon: User },
  { href: "/tags", label: "Etiquetas", icon: Tag },
];
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="text-indigo-400 w-6 h-6" />
          <span className="font-bold text-sm leading-tight">Centro de Inteligencia de Reuniones</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
