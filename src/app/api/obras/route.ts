import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const createObraSchema = z.object({
  codigo: z.string().min(1),
  descricao: z.string().min(1),
  razaoSocial: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  contratanteId: z.string().min(1),
  valorContrato: z.number().positive(),
  saldoMaoDeObra: z.number().positive(),
  saldoMaterial: z.number().positive(),
  dataInicio: z.string().optional().nullable(),
  dataFimPrevisto: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const obras = await prisma.obra.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { descricao: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status: status as any } : {},
      ],
    },
    include: {
      contratante: { select: { id: true, nome: true } },
      _count: { select: { medicoes: true, notasMaterial: true, alertas: { where: { lido: false } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(obras);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dataInicio, dataFimPrevisto, ...rest } = parsed.data;

  const obra = await prisma.obra.create({
    data: {
      ...rest,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataFimPrevisto: dataFimPrevisto ? new Date(dataFimPrevisto) : null,
    },
    include: { contratante: { select: { id: true, nome: true } } },
  });

  return NextResponse.json(obra, { status: 201 });
}
