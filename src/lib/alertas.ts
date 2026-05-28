import { prisma } from "@/lib/prisma";
import { TipoAlerta } from "@prisma/client";

export async function verificarEGerarAlertas(obraId: string) {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) return;

  const totalMedicoes = Number(obra.totalMedicoes);
  const saldoMaoDeObra = Number(obra.saldoMaoDeObra);
  const valorContrato = Number(obra.valorContrato);
  const totalGeral = totalMedicoes + Number(obra.totalNotas);

  const percMaoDeObra = saldoMaoDeObra > 0
    ? Math.round((totalMedicoes / saldoMaoDeObra) * 100)
    : 0;

  const percContrato = valorContrato > 0
    ? Math.round((totalGeral / valorContrato) * 100)
    : 0;

  const alertasExistentes = await prisma.alerta.findMany({
    where: { obraId },
    select: { tipo: true },
  });
  const tiposExistentes = new Set(alertasExistentes.map((a) => a.tipo));

  const novosAlertas: { tipo: TipoAlerta; mensagem: string }[] = [];

  if (percMaoDeObra >= 80 && !tiposExistentes.has(TipoAlerta.MAO_DE_OBRA_80)) {
    novosAlertas.push({
      tipo: TipoAlerta.MAO_DE_OBRA_80,
      mensagem: `Mão de obra atingiu ${percMaoDeObra}% do saldo. Verifique saldo de material.`,
    });
  }

  if (percMaoDeObra >= 90 && !tiposExistentes.has(TipoAlerta.MAO_DE_OBRA_90)) {
    novosAlertas.push({
      tipo: TipoAlerta.MAO_DE_OBRA_90,
      mensagem: `Mão de obra atingiu ${percMaoDeObra}% do saldo. Solicite o Termo de Conclusão.`,
    });
  }

  if (percContrato >= 100 && !tiposExistentes.has(TipoAlerta.CONTRATO_100)) {
    novosAlertas.push({
      tipo: TipoAlerta.CONTRATO_100,
      mensagem: `Contrato atingiu 100%. Obra marcada como próxima do encerramento.`,
    });
    await prisma.obra.update({
      where: { id: obraId },
      data: { status: "PROXIMO_ENCERRAMENTO" },
    });
  }

  if (novosAlertas.length > 0) {
    await prisma.alerta.createMany({
      data: novosAlertas.map((a) => ({ ...a, obraId })),
    });
  }
}
