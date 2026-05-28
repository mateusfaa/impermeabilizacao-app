import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

const ROLE_VARIANT: Record<Role, any> = {
  ADMINISTRADOR: "destructive",
  FINANCEIRO: "info",
  OPERACIONAL: "success",
  VISUALIZACAO: "secondary",
};

export default async function UsuariosPage() {
  const session = await auth();
  const role = (session?.user as any)?.role as Role;
  if (role !== Role.ADMINISTRADOR) redirect("/dashboard");

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm">{usuarios.length} usuário(s)</p>
        </div>
        <Button asChild>
          <Link href="/usuarios/novo">
            <Plus size={16} />
            Novo Usuário
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-4 font-medium text-slate-600">Nome</th>
                <th className="text-left p-4 font-medium text-slate-600">E-mail</th>
                <th className="text-left p-4 font-medium text-slate-600">Perfil</th>
                <th className="text-left p-4 font-medium text-slate-600">Status</th>
                <th className="text-left p-4 font-medium text-slate-600">Desde</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.ativo ? "success" : "secondary"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
