import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import { verificarEGerarAlertas } from "@/lib/alertas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const schema = z.object({
  obraId: z.string().min(1),
  fornecedorId: z.string().min(1),
  numeroNota: z.string().min(1),
  valor: z.number().positive(),
  dataEmissao: z.string(),
  dataVencimento: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role === Role.VISUALIZACAO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await req.formData();

  const rawData = {
    obraId: formData.get("obraId") as string,
    fornecedorId: formData.get("fornecedorId") as string,
    numeroNota: formData.get("numeroNota") as string,
    valor: parseFloat(formData.get("valor") as string),
    dataEmissao: formData.get("dataEmissao") as string,
    dataVencimento: (formData.get("dataVencimento") as string) || null,
    descricao: (formData.get("descricao") as string) || null,
  };

  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let pdfUrl: string | null = null;
  let pdfNome: string | null = null;

  const arquivo = formData.get("pdf") as File | null;
  if (arquivo && arquivo.size > 0) {
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    pdfUrl = `/uploads/${fileName}`;
    pdfNome = arquivo.name;
  }

  const { dataEmissao, dataVencimento, ...rest } = parsed.data;

  const nota = await prisma.notaMaterial.create({
    data: {
      ...rest,
      dataEmissao: new Date(dataEmissao),
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      pdfUrl,
      pdfNome,
    },
  });

  await prisma.obra.update({
    where: { id: parsed.data.obraId },
    data: {
      totalNotas: { increment: parsed.data.valor },
    },
  });

  await verificarEGerarAlertas(parsed.data.obraId);

  return NextResponse.json(nota, { status: 201 });
}
