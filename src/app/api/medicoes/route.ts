import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import { verificarEGerarAlertas } from "@/lib/alertas";

const schema = z.object({
  obraId: z.string().min(1),
  numero: z.number().int().positive(),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  dataEmissao: z.string(),
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(["PENDENTE", "APROVADA", "PAGA", "CANCELADA"]).optional(),
  observacoes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dataEmissao, dataPagamento, ...rest } = parsed.data;

  const medicao = await prisma.medicaoMaoDeObra.create({
    data: {
      ...rest,
      dataEmissao: new Date(dataEmissao),
      dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
    },
  });

  await prisma.obra.update({
    where: { id: parsed.data.obraId },
    data: {
      totalMedicoes: {
        increment: parsed.data.valor,
      },
    },
  });

  await verificarEGerarAlertas(parsed.data.obraId);

  return NextResponse.json(medicao, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const body = await req.json();
  const statusSchema = z.object({
    status: z.enum(["PENDENTE", "APROVADA", "PAGA", "CANCELADA"]),
    dataPagamento: z.string().optional().nullable(),
  });

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const medicao = await prisma.medicaoMaoDeObra.update({
    where: { id },
    data: {
      status: parsed.data.status,
      dataPagamento: parsed.data.dataPagamento ? new Date(parsed.data.dataPagamento) : null,
    },
  });

  return NextResponse.json(medicao);
}
