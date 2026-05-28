import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, calcularPercentual } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, AlertTriangle, Pencil } from "lucide-react";
import { StatusObra } from "@prisma/client";
import { DeleteButton } from "@/components/ui/delete-button";

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

export default async function ObrasPage() {
  const obras = await prisma.obra.findMany({
    include: {
      contratante: { select: { nome: true } },
      _count: { select: { alertas: { where: { lido: false } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Obras / Contratos</h1>
          <p className="text-slate-500 text-sm">{obras.length} obra(s) cadastrada(s)</p>
        </div>
        <Button asChild>
          <Link href="/obras/nova">
            <Plus size={16} />
            Nova Obra
          </Link>
        </Button>
      </div>

      {obras.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
            <Button asChild className="mt-4">
              <Link href="/obras/nova">Cadastrar primeira obra</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {obras.map((obra) => {
            const percMdo = calcularPercentual(
              Number(obra.totalMedicoes),
              Number(obra.saldoMaoDeObra)
            );
            const percMat = calcularPercentual(
              Number(obra.totalNotas),
              Number(obra.saldoMaterial)
            );
            const percGeral = calcularPercentual(
              Number(obra.totalMedicoes) + Number(obra.totalNotas),
              Number(obra.valorContrato)
            );

            return (
              <Card key={obra.id} className="hover:shadow-md transition-shadow relative">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/obras/${obra.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {obra.codigo}
                        </span>
                        <Badge variant={STATUS_VARIANTS[obra.status]}>
                          {STATUS_LABELS[obra.status]}
                        </Badge>
                        {obra._count.alertas > 0 && (
                          <span className="flex items-center gap-1 text-xs text-orange-600">
                            <AlertTriangle size={12} />
                            {obra._count.alertas} alerta(s)
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{obra.descricao}</p>
                      <p className="text-sm text-slate-500">{obra.contratante.nome}</p>
                    </Link>

                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-slate-800">
                        {formatCurrency(Number(obra.valorContrato))}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">
                          Início: {formatDate(obra.dataInicio)}
                        </p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/obras/${obra.id}/editar`}>
                            <Pencil size={12} />
                            Editar
                          </Link>
                        </Button>
                        <DeleteButton
                          apiUrl={`/api/obras/${obra.id}`}
                          confirmMessage={`Excluir a obra "${obra.descricao}" (${obra.codigo})? Todas as medições, notas e alertas serão removidos. Esta ação não pode ser desfeita.`}
                          className="h-7 w-7"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Mão de Obra</span>
                        <span className={percMdo >= 90 ? "text-red-600 font-bold" : percMdo >= 80 ? "text-yellow-600 font-bold" : ""}>{percMdo}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${percMdo >= 90 ? "bg-red-500" : percMdo >= 80 ? "bg-yellow-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(percMdo, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCurrency(Number(obra.totalMedicoes))} / {formatCurrency(Number(obra.saldoMaoDeObra))}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Material</span>
                        <span>{percMat}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{ width: `${Math.min(percMat, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCurrency(Number(obra.totalNotas))} / {formatCurrency(Number(obra.saldoMaterial))}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Contrato</span>
                        <span className={percGeral >= 100 ? "text-red-600 font-bold" : ""}>{percGeral}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${percGeral >= 100 ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(percGeral, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCurrency(Number(obra.totalMedicoes) + Number(obra.totalNotas))} total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
