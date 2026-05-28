import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const updateSchema = z.object({
  fornecedorId: z.string().min(1).optional(),
  numeroNota: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataEmissao: z.string().optional(),
  dataVencimento: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  status: z.enum(["PENDENTE", "PAGA", "CANCELADA"]).optional(),
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

  const notaAtual = await prisma.notaMaterial.findUnique({ where: { id } });
  if (!notaAtual) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });

  // Suporta multipart (com PDF) ou JSON simples
  const contentType = req.headers.get("content-type") ?? "";
  let updateData: any = {};
  let novoPdf: { pdfUrl: string; pdfNome: string } | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const raw: Record<string, any> = {};
    for (const [key, val] of formData.entries()) {
      if (key !== "pdf") raw[key] = val;
    }
    if (raw.valor) raw.valor = parseFloat(raw.valor);

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { dataEmissao, dataVencimento, valor, ...rest } = parsed.data;
    updateData = { ...rest };
    if (dataEmissao) updateData.dataEmissao = new Date(dataEmissao);
    if (dataVencimento !== undefined) {
      updateData.dataVencimento = dataVencimento ? new Date(dataVencimento) : null;
    }
    if (valor !== undefined) updateData.valor = valor;

    const arquivo = formData.get("pdf") as File | null;
    if (arquivo && arquivo.size > 0) {
      const bytes = await arquivo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const fileName = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await writeFile(path.join(uploadDir, fileName), buffer);
      novoPdf = { pdfUrl: `/uploads/${fileName}`, pdfNome: arquivo.name };
    }
  } else {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { dataEmissao, dataVencimento, valor, ...rest } = parsed.data;
    updateData = { ...rest };
    if (dataEmissao) updateData.dataEmissao = new Date(dataEmissao);
    if (dataVencimento !== undefined) {
      updateData.dataVencimento = dataVencimento ? new Date(dataVencimento) : null;
    }
    if (valor !== undefined) updateData.valor = valor;
  }

  if (novoPdf) {
    updateData.pdfUrl = novoPdf.pdfUrl;
    updateData.pdfNome = novoPdf.pdfNome;
  }

  const nota = await prisma.notaMaterial.update({ where: { id }, data: updateData });

  // Recalcular totalNotas na obra se o valor mudou
  const valorNovo = updateData.valor;
  if (valorNovo !== undefined && valorNovo !== Number(notaAtual.valor)) {
    const diff = valorNovo - Number(notaAtual.valor);
    await prisma.obra.update({
      where: { id: notaAtual.obraId },
      data: { totalNotas: { increment: diff } },
    });
  }

  return NextResponse.json(nota);
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
  const nota = await prisma.notaMaterial.findUnique({ where: { id } });
  if (!nota) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  await prisma.notaMaterial.delete({ where: { id } });

  await prisma.obra.update({
    where: { id: nota.obraId },
    data: { totalNotas: { decrement: Number(nota.valor) } },
  });

  return NextResponse.json({ success: true });
}
