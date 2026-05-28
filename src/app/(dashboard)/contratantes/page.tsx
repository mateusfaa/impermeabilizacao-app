import { prisma } from "@/lib/prisma";
import { formatCpfCnpj } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Building2, Pencil } from "lucide-react";
import { DeleteButton } from "@/components/ui/delete-button";

export default async function ContratantesPage() {
  const contratantes = await prisma.contratante.findMany({
    include: { _count: { select: { obras: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contratantes</h1>
          <p className="text-slate-500 text-sm">{contratantes.length} contratante(s) cadastrado(s)</p>
        </div>
        <Button asChild>
          <Link href="/contratantes/novo">
            <Plus size={16} />
            Novo Contratante
          </Link>
        </Button>
      </div>

      {contratantes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground">Nenhum contratante cadastrado ainda.</p>
            <Button asChild className="mt-4">
              <Link href="/contratantes/novo">Cadastrar primeiro contratante</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contratantes.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Building2 size={18} className="text-green-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c._count.obras} obra(s)</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/contratantes/${c.id}/editar`}>
                        <Pencil size={14} />
                      </Link>
                    </Button>
                    <DeleteButton
                      apiUrl={`/api/contratantes/${c.id}`}
                      confirmMessage={`Excluir o contratante "${c.nome}"? Esta ação não pode ser desfeita.`}
                      disabled={c._count.obras > 0}
                      disabledTitle={`Não é possível excluir: possui ${c._count.obras} obra(s) vinculada(s)`}
                    />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 mt-2">{c.nome}</h3>
                <p className="text-xs text-slate-500 font-mono">{formatCpfCnpj(c.cpfCnpj)}</p>
                {c.email && <p className="text-xs text-slate-500 mt-1">{c.email}</p>}
                {c.telefone && <p className="text-xs text-slate-500">{c.telefone}</p>}
                {(c.cidade || c.estado) && (
                  <p className="text-xs text-slate-400 mt-1">
                    {[c.cidade, c.estado].filter(Boolean).join(" - ")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
