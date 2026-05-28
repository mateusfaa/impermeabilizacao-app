import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditarContratanteForm from "./form";

export default async function EditarContratantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contratante = await prisma.contratante.findUnique({ where: { id } });
  if (!contratante) notFound();

  return <EditarContratanteForm contratante={contratante} />;
}
