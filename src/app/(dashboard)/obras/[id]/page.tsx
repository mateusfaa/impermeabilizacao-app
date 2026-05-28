import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, calcularPercentual } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Plus, AlertTriangle, FileText, Hammer, Pencil } from "lucide-react";
import { StatusObra, StatusMedicao, StatusNota, TipoAlerta } from "@prisma/client";

const STATUS_LABELS: Record<StatusObra, string> = {
  EM_ANDAMENTO: "Em Andamento",
  PROXIMO_ENCERRAMENTO: "Próx. Encerramento",
  ENCERRADA: "Encerrada",
  PAUSADA: "Pausada",
};

const MEDICAO_STATUS: Record<StatusMedicao, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

const NOTA_STATUS: Record<StatusNota, string> = {
  PENDENTE: "Pendente",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

const ALERTA_LABELS: Record<TipoAlerta, string> = {
  MAO_DE_OBRA_80: "Mão de Obra 80%",
  MAO_DE_OBRA_90: "Mão de Obra 90%",
  CONTRATO_100: "Contrato 100%",
};

export default async function ObraDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      contratante: true,
      medicoes: { orderBy: { numero: "asc" } },
      notasMaterial: {
        include: { fornecedor: { select: { nome: true } } },
        orderBy: { dataEmissao: "desc" },
      },
      alertas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!obra) notFound();

  const percMdo = calcularPercentual(Number(obra.totalMedicoes), Number(obra.saldoMaoDeObra));
  const percMat = calcularPercentual(Number(obra.totalNotas), Number(obra.saldoMaterial));
  const percGeral = calcularPercentual(
    Number(obra.totalMedicoes) + Number(obra.totalNotas),
    Number(obra.valorContrato)
  );

  const alertasAtivos = obra.alertas.filter((a) => !a.lido);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/obras"><ArrowLeft size={18} /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{obra.codigo}</span>
            <Badge variant={obra.status === "EM_ANDAMENTO" ? "success" : obra.status === "PROXIMO_ENCERRAMENTO" ? "warning" : "secondary"}>
              {STATUS_LABELS[obra.status]}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mt-1">{obra.descricao}</h1>
          <p className="text-sm text-slate-500">{obra.contratante.nome}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/obras/${id}/editar`}>
            <Pencil size={14} />
            Editar
          </Link>
        </Button>
      </div>

      {alertasAtivos.length > 0 && (
        <div className="space-y-2">
          {alertasAtivos.map((alerta) => (
            <div key={alerta.id} className={`flex items-start gap-3 p-3 rounded-lg border ${alerta.tipo === "CONTRATO_100" ? "bg-red-50 border-red-200" : alerta.tipo === "MAO_DE_OBRA_90" ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200"}`}>
              <AlertTriangle size={16} className={alerta.tipo === "CONTRATO_100" ? "text-red-600 mt-0.5" : "text-yellow-600 mt-0.5"} />
              <div>
                <p className="text-sm font-medium">{ALERTA_LABELS[alerta.tipo]}</p>
                <p className="text-xs text-slate-600">{alerta.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Valor Total do Contrato</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(obra.valorContrato))}</p>
            <p className="text-xs text-slate-500 mt-1">
              Início: {formatDate(obra.dataInicio)} · Fim: {formatDate(obra.dataFimPrevisto)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">Mão de Obra</p>
              <span className={`text-xs font-bold ${percMdo >= 90 ? "text-red-600" : percMdo >= 80 ? "text-yellow-600" : "text-slate-600"}`}>{percMdo}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full ${percMdo >= 90 ? "bg-red-500" : percMdo >= 80 ? "bg-yellow-500" : "bg-blue-500"}`} style={{ width: `${Math.min(percMdo, 100)}%` }} />
            </div>
            <p className="text-sm font-medium">{formatCurrency(Number(obra.totalMedicoes))}</p>
            <p className="text-xs text-slate-500">de {formatCurrency(Number(obra.saldoMaoDeObra))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">Material / Fat. Direto</p>
              <span className="text-xs font-bold text-slate-600">{percMat}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(percMat, 100)}%` }} />
            </div>
            <p className="text-sm font-medium">{formatCurrency(Number(obra.totalNotas))}</p>
            <p className="text-xs text-slate-500">de {formatCurrency(Number(obra.saldoMaterial))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hammer size={16} />
              Medições de Mão de Obra ({obra.medicoes.length})
            </CardTitle>
            <Button size="sm" asChild>
              <Link href={`/obras/${obra.id}/medicoes`}>
                <Plus size={14} />
                Nova
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {obra.medicoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma medição registrada.</p>
            ) : (
              <div className="space-y-2">
                {obra.medicoes.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">Medição #{m.numero}</span>
                      <p className="text-xs text-slate-500">{m.descricao}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(m.valor))}</p>
                      <Badge variant={m.status === "PAGA" ? "success" : m.status === "CANCELADA" ? "destructive" : "outline"} className="text-xs">
                        {MEDICAO_STATUS[m.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
                {obra.medicoes.length > 5 && (
                  <Link href={`/obras/${obra.id}/medicoes`} className="text-xs text-blue-600 hover:underline block text-center pt-1">
                    Ver todas ({obra.medicoes.length})
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} />
              Notas de Material ({obra.notasMaterial.length})
            </CardTitle>
            <Button size="sm" asChild>
              <Link href={`/obras/${obra.id}/materiais`}>
                <Plus size={14} />
                Nova
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {obra.notasMaterial.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota registrada.</p>
            ) : (
              <div className="space-y-2">
                {obra.notasMaterial.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">NF {n.numeroNota}</span>
                      <p className="text-xs text-slate-500">{n.fornecedor.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(n.valor))}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Badge variant={n.status === "PAGA" ? "success" : "outline"} className="text-xs">
                          {NOTA_STATUS[n.status]}
                        </Badge>
                        {n.pdfUrl && (
                          <a href={n.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <FileText size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {obra.notasMaterial.length > 5 && (
                  <Link href={`/obras/${obra.id}/materiais`} className="text-xs text-blue-600 hover:underline block text-center pt-1">
                    Ver todas ({obra.notasMaterial.length})
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
