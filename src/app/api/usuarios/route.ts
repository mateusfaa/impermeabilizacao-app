import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
  ativo: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMINISTRADOR) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMINISTRADOR) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const usuario = await prisma.user.create({
    data: { ...parsed.data, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMINISTRADOR) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.password) {
    updateData.password = await bcrypt.hash(parsed.data.password, 10);
  }

  const usuario = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(usuario);
}
