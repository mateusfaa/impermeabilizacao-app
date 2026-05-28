"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  HardHat,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Role } from "@prisma/client";

interface SidebarProps {
  userRole: Role;
}

const navItems: { href: string; label: string; icon: React.ElementType; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [] },
  { href: "/obras", label: "Obras", icon: HardHat, roles: [] },
  { href: "/contratantes", label: "Contratantes", icon: Building2, roles: [] },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, roles: [] },
  { href: "/alertas", label: "Alertas", icon: Bell, roles: [] },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    roles: [Role.ADMINISTRADOR],
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">FoxSystem</p>
            <p className="text-xs text-slate-400">Gestão de Obras</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
