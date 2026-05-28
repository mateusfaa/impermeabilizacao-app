import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/utils";
import { Role } from "@prisma/client";
import Link from "next/link";

export async function Header() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role;

  const alertasNaoLidos = await prisma.alerta.count({
    where: { lido: false },
  });

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <Link href="/alertas" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-slate-600" />
          {alertasNaoLidos > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertasNaoLidos > 9 ? "9+" : alertasNaoLidos}
            </span>
          )}
        </Link>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{session?.user?.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[userRole]}</p>
        </div>
      </div>
    </header>
  );
}
