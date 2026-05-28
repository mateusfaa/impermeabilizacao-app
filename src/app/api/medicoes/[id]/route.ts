import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import { verificarEGerarAlertas } from "@/lib/alertas";

const updateSchema = z.object({
  numero: z.number().int().positive().optional(),
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataEmissao: z.string().optional(),
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(["PENDENTE", "APROVADA", "PAGA", "CANCELADA"]).optional(),
  observacoes: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Buscar medição atual para calcular diff de valor
  const medicaoAtual = await prisma.medicaoMaoDeObra.findUnique({ where: { id } });
  if (!medicaoAtual) return NextResponse.json({ error: "Medição não encontrada" }, { status: 404 });

  const { dataEmissao, dataPagamento, valor, ...rest } = parsed.data;
  const updateData: any = { ...rest };

  if (dataEmissao) updateData.dataEmissao = new Date(dataEmissao);
  if (dataPagamento !== undefined) {
    updateData.dataPagamento = dataPagamento ? new Date(dataPagamento) : null;
  }
  if (valor !== undefined) updateData.valor = valor;

  const medicao = await prisma.medicaoMaoDeObra.update({
    where: { id },
    data: updateData,
  });

  // Atualizar totalMedicoes na obra se o valor mudou
  if (valor !== undefined && valor !== Number(medicaoAtual.valor)) {
    const diff = valor - Number(medicaoAtual.valor);
    await prisma.obra.update({
      where: { id: medicaoAtual.obraId },
      data: { totalMedicoes: { increment: diff } },
    });
    await verificarEGerarAlertas(medicaoAtual.obraId);
  }

  return NextResponse.json(medicao);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO || role === Role.OPERACIONAL) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const medicao = await prisma.medicaoMaoDeObra.findUnique({ where: { id } });
  if (!medicao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  await prisma.medicaoMaoDeObra.delete({ where: { id } });

  await prisma.obra.update({
    where: { id: medicao.obraId },
    data: { totalMedicoes: { decrement: Number(medicao.valor) } },
  });

  return NextResponse.json({ success: true });
}
