import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditarObraForm from "./form";

export default async function EditarObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [obra, contratantes] = await Promise.all([
    prisma.obra.findUnique({
      where: { id },
      include: { contratante: { select: { id: true, nome: true } } },
    }),
    prisma.contratante.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!obra) notFound();

  return <EditarObraForm obra={obra} contratantes={contratantes} />;
}
