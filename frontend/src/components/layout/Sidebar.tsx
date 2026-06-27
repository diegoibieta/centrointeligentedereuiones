"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Brain, Users, Truck, Building2, Search,
  FolderKanban, LayoutDashboard, CheckSquare,
  ChevronLeft, ChevronRight, Plus,
} from "lucide-react";
import { UploadModal } from "@/components/meetings/UploadModal";

function TrendingUp(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

const nav = [
  { href: "/search", label: "Busqueda Semantica", icon: Search },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tareas y Analisis", icon: CheckSquare },
  { href: "/meetings", label: "Todas las Reuniones", icon: Brain },
  { href: "/meetings?module=investors", label: "Inversionistas", icon: TrendingUp },
  { href: "/meetings?module=clients", label: "Clientes", icon: Users },
  { href: "/meetings?module=suppliers", label: "Proveedores", icon: Truck },
  { href: "/meetings?module=internal", label: "Internas", icon: Building2 },
  { href: "/comunidades", label: "Comunidades", icon: FolderKanban },
];

function NavContent({ collapsed }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentModule = searchParams.get("module");

  const isActive = (href) => {
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    if (!query) return path !== "/meetings" || !currentModule;
    return new URLSearchParams(query).get("module") === currentModule;
  };

  return (
    <>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            collapsed ? "justify-center" : "",
            isActive(href)
              ? "bg-brand-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      ))}
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 h-screen bg-gray-900 text-gray-100 flex flex-col shrink-0 transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn(
          "flex items-center border-b border-gray-700 shrink-0 h-14",
          collapsed ? "justify-center px-2" : "px-4 gap-2"
        )}>
          <Brain className="text-brand-500 w-5 h-5 shrink-0" />
          {!collapsed && (
            <span className="font-bold text-xs leading-tight flex-1 min-w-0 truncate">
              Centro de Inteligencia<br />de Reuniones
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expandir" : "Colapsar"}
            className="text-gray-400 hover:text-white transition-colors rounded p-0.5 shrink-0 ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
          <Suspense>
            <NavContent collapsed={collapsed} />
          </Suspense>
        </div>

        <div className={cn(
          "shrink-0 p-2 border-t border-gray-700",
          collapsed ? "flex justify-center" : ""
        )}>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            title="Nueva Reunion"
            className={cn(
              "flex items-center gap-2 rounded-lg text-sm bg-brand-600 hover:bg-brand-700 text-white transition-colors font-medium",
              collapsed ? "justify-center w-10 h-10" : "w-full px-3 py-2"
            )}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Nueva Reunion</span>}
          </button>
        </div>
      </aside>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => setShowUpload(false)} />
      )}
    </>
  );
}