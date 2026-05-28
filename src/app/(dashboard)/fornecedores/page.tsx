import { prisma } from "@/lib/prisma";
import { formatCpfCnpj } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Truck, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/ui/delete-button";

export default async function FornecedoresPage() {
  const fornecedores = await prisma.fornecedor.findMany({
    include: { _count: { select: { notasMaterial: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-slate-500 text-sm">{fornecedores.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <Button asChild>
          <Link href="/fornecedores/novo">
            <Plus size={16} />
            Novo Fornecedor
          </Link>
        </Button>
      </div>

      {fornecedores.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground">Nenhum fornecedor cadastrado ainda.</p>
            <Button asChild className="mt-4">
              <Link href="/fornecedores/novo">Cadastrar primeiro fornecedor</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Truck size={18} className="text-purple-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{f._count.notasMaterial} nota(s)</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/fornecedores/${f.id}/editar`}>
                        <Pencil size={14} />
                      </Link>
                    </Button>
                    <DeleteButton
                      apiUrl={`/api/fornecedores/${f.id}`}
                      confirmMessage={`Excluir o fornecedor "${f.nome}"? Esta ação não pode ser desfeita.`}
                      disabled={f._count.notasMaterial > 0}
                      disabledTitle={`Não é possível excluir: possui ${f._count.notasMaterial} nota(s) vinculada(s)`}
                    />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 mt-2">{f.nome}</h3>
                <p className="text-xs text-slate-500 font-mono">{formatCpfCnpj(f.cpfCnpj)}</p>
                {f.email && <p className="text-xs text-slate-500 mt-1">{f.email}</p>}
                {f.telefone && <p className="text-xs text-slate-500">{f.telefone}</p>}
                {(f.cidade || f.estado) && (
                  <p className="text-xs text-slate-400 mt-1">{[f.cidade, f.estado].filter(Boolean).join(" - ")}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
