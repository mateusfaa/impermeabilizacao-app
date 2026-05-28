import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { TipoAlerta } from "@prisma/client";
import Link from "next/link";
import { MarkAlertasRead } from "./mark-read";

const ALERTA_LABELS: Record<TipoAlerta, string> = {
  MAO_DE_OBRA_80: "Mão de Obra ≥ 80%",
  MAO_DE_OBRA_90: "Mão de Obra ≥ 90%",
  CONTRATO_100: "Contrato 100%",
};

const ALERTA_COLORS: Record<TipoAlerta, string> = {
  MAO_DE_OBRA_80: "border-yellow-200 bg-yellow-50",
  MAO_DE_OBRA_90: "border-orange-200 bg-orange-50",
  CONTRATO_100: "border-red-200 bg-red-50",
};

const ALERTA_ICON_COLORS: Record<TipoAlerta, string> = {
  MAO_DE_OBRA_80: "text-yellow-600",
  MAO_DE_OBRA_90: "text-orange-600",
  CONTRATO_100: "text-red-600",
};

export default async function AlertasPage() {
  const alertas = await prisma.alerta.findMany({
    include: { obra: { select: { id: true, codigo: true, descricao: true } } },
    orderBy: [{ lido: "asc" }, { createdAt: "desc" }],
  });

  const naoLidos = alertas.filter((a) => !a.lido);
  const lidos = alertas.filter((a) => a.lido);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
          <p className="text-slate-500 text-sm">
            {naoLidos.length} alerta(s) não lido(s)
          </p>
        </div>
        {naoLidos.length > 0 && (
          <MarkAlertasRead ids={naoLidos.map((a) => a.id)} />
        )}
      </div>

      {alertas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground">Nenhum alerta gerado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {naoLidos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 mb-3">Não lidos</h2>
              <div className="space-y-2">
                {naoLidos.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${ALERTA_COLORS[alerta.tipo]}`}
                  >
                    <AlertTriangle size={18} className={`${ALERTA_ICON_COLORS[alerta.tipo]} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="warning" className="text-xs">{ALERTA_LABELS[alerta.tipo]}</Badge>
                        <span className="text-xs text-slate-500">{formatDate(alerta.createdAt)}</span>
                      </div>
                      <p className="text-sm">{alerta.mensagem}</p>
                      <Link
                        href={`/obras/${alerta.obra.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        {alerta.obra.codigo} · {alerta.obra.descricao}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lidos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3">Lidos</h2>
              <div className="space-y-2">
                {lidos.map((alerta) => (
                  <div key={alerta.id} className="flex items-start gap-3 p-4 rounded-lg border bg-slate-50 opacity-60">
                    <CheckCircle2 size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{ALERTA_LABELS[alerta.tipo]}</Badge>
                        <span className="text-xs text-slate-400">{formatDate(alerta.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-500">{alerta.mensagem}</p>
                      <Link href={`/obras/${alerta.obra.id}`} className="text-xs text-slate-400 hover:underline mt-1 block">
                        {alerta.obra.codigo} · {alerta.obra.descricao}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
