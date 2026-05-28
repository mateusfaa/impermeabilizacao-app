import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const schema = z.object({
  nome: z.string().min(1),
  cpfCnpj: z.string().min(11),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const fornecedores = await prisma.fornecedor.findMany({
    where: search
      ? {
          OR: [
            { nome: { contains: search, mode: "insensitive" } },
            { cpfCnpj: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { notasMaterial: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(fornecedores);
}

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

  const fornecedor = await prisma.fornecedor.create({ data: parsed.data });
  return NextResponse.json(fornecedor, { status: 201 });
}
