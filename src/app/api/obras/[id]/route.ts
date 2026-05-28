import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateObraSchema = z.object({
  descricao: z.string().min(1).optional(),
  razaoSocial: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  contratanteId: z.string().min(1).optional(),
  valorContrato: z.number().positive().optional(),
  saldoMaoDeObra: z.number().positive().optional(),
  saldoMaterial: z.number().positive().optional(),
  dataInicio: z.string().optional().nullable(),
  dataFimPrevisto: z.string().optional().nullable(),
  dataFimReal: z.string().optional().nullable(),
  status: z.enum(["EM_ANDAMENTO", "PROXIMO_ENCERRAMENTO", "ENCERRADA", "PAUSADA"]).optional(),
  observacoes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      contratante: true,
      medicoes: { orderBy: { numero: "asc" } },
      notasMaterial: {
        include: { fornecedor: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
      },
      alertas: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!obra) return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  return NextResponse.json(obra);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dataInicio, dataFimPrevisto, dataFimReal, ...rest } = parsed.data;
  const updateData: any = { ...rest };
  if (dataInicio !== undefined) updateData.dataInicio = dataInicio ? new Date(dataInicio) : null;
  if (dataFimPrevisto !== undefined) updateData.dataFimPrevisto = dataFimPrevisto ? new Date(dataFimPrevisto) : null;
  if (dataFimReal !== undefined) updateData.dataFimReal = dataFimReal ? new Date(dataFimReal) : null;

  const obra = await prisma.obra.update({
    where: { id },
    data: updateData,
    include: { contratante: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(obra);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMINISTRADOR) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.obra.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
