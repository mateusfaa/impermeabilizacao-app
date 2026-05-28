import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({ ids: z.array(z.string()) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  }

  await prisma.alerta.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { lido: true },
  });

  return NextResponse.json({ success: true });
}
