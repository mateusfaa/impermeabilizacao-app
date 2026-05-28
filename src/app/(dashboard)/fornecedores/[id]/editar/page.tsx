import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditarFornecedorForm from "./form";

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
  if (!fornecedor) notFound();

  return <EditarFornecedorForm fornecedor={fornecedor} />;
}
