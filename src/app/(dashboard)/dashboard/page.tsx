import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Building2, Truck, Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusObra } from "@prisma/client";

const STATUS_LABELS: Record<StatusObra, string> = {
  EM_ANDAMENTO: "Em Andamento",
  PROXIMO_ENCERRAMENTO: "Próx. Encerramento",
  ENCERRADA: "Encerrada",
  PAUSADA: "Pausada",
};

const STATUS_VARIANTS: Record<StatusObra, "success" | "warning" | "secondary" | "outline"> = {
  EM_ANDAMENTO: "success",
  PROXIMO_ENCERRAMENTO: "warning",
  ENCERRADA: "secondary",
  PAUSADA: "outline",
};

export default async function DashboardPage() {
  const [totalObras, totalContratantes, totalFornecedores, alertasNaoLidos, obrasRecentes] =
    await Promise.all([
      prisma.obra.count(),
      prisma.contratante.count(),
      prisma.fornecedor.count(),
      prisma.alerta.count({ where: { lido: false } }),
      prisma.obra.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { contratante: { select: { nome: true } } },
      }),
    ]);

  const obrasPorStatus = await prisma.obra.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const totalContratos = await prisma.obra.aggregate({
    _sum: { valorContrato: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Obras</p>
                <p className="text-3xl font-bold mt-1">{totalObras}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <HardHat className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratantes</p>
                <p className="text-3xl font-bold mt-1">{totalContratantes}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Building2 className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores</p>
                <p className="text-3xl font-bold mt-1">{totalFornecedores}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Truck className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className="text-3xl font-bold mt-1">{alertasNaoLidos}</p>
              </div>
              <div className={`p-3 rounded-full ${alertasNaoLidos > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <Bell className={alertasNaoLidos > 0 ? "text-red-600" : "text-gray-500"} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Obras Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {obrasRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma obra cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {obrasRecentes.map((obra) => (
                  <Link
                    key={obra.id}
                    href={`/obras/${obra.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{obra.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {obra.codigo} · {obra.contratante.nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={STATUS_VARIANTS[obra.status]}>
                        {STATUS_LABELS[obra.status]}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(Number(obra.valorContrato))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das Obras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {obrasPorStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === "EM_ANDAMENTO" && <CheckCircle2 size={14} className="text-green-500" />}
                  {item.status === "PROXIMO_ENCERRAMENTO" && <AlertTriangle size={14} className="text-yellow-500" />}
                  {item.status === "ENCERRADA" && <CheckCircle2 size={14} className="text-slate-400" />}
                  {item.status === "PAUSADA" && <AlertTriangle size={14} className="text-orange-400" />}
                  <span className="text-sm">{STATUS_LABELS[item.status as StatusObra]}</span>
                </div>
                <span className="font-bold text-sm">{item._count.status}</span>
              </div>
            ))}
            {obrasPorStatus.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
            )}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total contratado</span>
                <span className="text-blue-600">
                  {formatCurrency(Number(totalContratos._sum.valorContrato ?? 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
