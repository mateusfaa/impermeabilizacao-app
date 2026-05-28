"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { StatusObra } from "@prisma/client";

const STATUS_LABELS: Record<StatusObra, string> = {
  EM_ANDAMENTO: "Em Andamento",
  PROXIMO_ENCERRAMENTO: "Próx. Encerramento",
  ENCERRADA: "Encerrada",
  PAUSADA: "Pausada",
};

const schema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  contratanteId: z.string().min(1, "Contratante obrigatório"),
  valorContrato: z.string().min(1, "Valor obrigatório"),
  saldoMaoDeObra: z.string().min(1, "Saldo M.O. obrigatório"),
  saldoMaterial: z.string().min(1, "Saldo material obrigatório"),
  status: z.nativeEnum(StatusObra),
  dataInicio: z.string().optional(),
  dataFimPrevisto: z.string().optional(),
  dataFimReal: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ObraData {
  id: string;
  codigo: string;
  descricao: string;
  razaoSocial: string | null;
  cnpj: string | null;
  contratanteId: string;
  valorContrato: string | number;
  saldoMaoDeObra: string | number;
  saldoMaterial: string | number;
  status: StatusObra;
  dataInicio: Date | null;
  dataFimPrevisto: Date | null;
  dataFimReal: Date | null;
  observacoes: string | null;
}

function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function EditarObraForm({
  obra,
  contratantes,
}: {
  obra: ObraData;
  contratantes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: obra.descricao,
      razaoSocial: obra.razaoSocial ?? "",
      cnpj: obra.cnpj ?? "",
      contratanteId: obra.contratanteId,
      valorContrato: String(Number(obra.valorContrato).toFixed(2)),
      saldoMaoDeObra: String(Number(obra.saldoMaoDeObra).toFixed(2)),
      saldoMaterial: String(Number(obra.saldoMaterial).toFixed(2)),
      status: obra.status,
      dataInicio: toDateInput(obra.dataInicio),
      dataFimPrevisto: toDateInput(obra.dataFimPrevisto),
      dataFimReal: toDateInput(obra.dataFimReal),
      observacoes: obra.observacoes ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: data.descricao,
        razaoSocial: data.razaoSocial || null,
        cnpj: data.cnpj || null,
        contratanteId: data.contratanteId,
        valorContrato: parseFloat(data.valorContrato),
        saldoMaoDeObra: parseFloat(data.saldoMaoDeObra),
        saldoMaterial: parseFloat(data.saldoMaterial),
        status: data.status,
        dataInicio: data.dataInicio || null,
        dataFimPrevisto: data.dataFimPrevisto || null,
        dataFimReal: data.dataFimReal || null,
        observacoes: data.observacoes || null,
      }),
    });

    if (res.ok) {
      router.push(`/obras/${obra.id}`);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error?.formErrors?.[0] ?? "Erro ao salvar alterações.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/obras/${obra.id}`}>
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <p className="text-xs text-slate-500 font-mono">{obra.codigo}</p>
          <h1 className="text-2xl font-bold text-slate-800">Editar Obra</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={obra.codigo} disabled className="bg-slate-50 text-slate-500" />
                <p className="text-xs text-slate-400">O código não pode ser alterado.</p>
              </div>

              <div className="space-y-2">
                <Label>Contratante *</Label>
                <Select
                  defaultValue={obra.contratanteId}
                  onValueChange={(v) => setValue("contratanteId", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contratantes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contratanteId && (
                  <p className="text-xs text-destructive">{errors.contratanteId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da Obra *</Label>
              <Input {...register("descricao")} />
              {errors.descricao && (
                <p className="text-xs text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social da Obra</Label>
                <Input placeholder="Ex: Construtora XYZ Ltda." {...register("razaoSocial")} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ da Obra</Label>
                <Input placeholder="00.000.000/0001-00" {...register("cnpj")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor Total (R$) *</Label>
                <Input type="number" step="0.01" {...register("valorContrato")} />
                {errors.valorContrato && (
                  <p className="text-xs text-destructive">{errors.valorContrato.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Saldo Mão de Obra (R$) *</Label>
                <Input type="number" step="0.01" {...register("saldoMaoDeObra")} />
                {errors.saldoMaoDeObra && (
                  <p className="text-xs text-destructive">{errors.saldoMaoDeObra.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Saldo Material (R$) *</Label>
                <Input type="number" step="0.01" {...register("saldoMaterial")} />
                {errors.saldoMaterial && (
                  <p className="text-xs text-destructive">{errors.saldoMaterial.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={obra.status}
                onValueChange={(v) => setValue("status", v as StatusObra)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StatusObra).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" {...register("dataInicio")} />
              </div>
              <div className="space-y-2">
                <Label>Previsão de Término</Label>
                <Input type="date" {...register("dataFimPrevisto")} />
              </div>
              <div className="space-y-2">
                <Label>Data de Encerramento</Label>
                <Input type="date" {...register("dataFimReal")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea rows={3} {...register("observacoes")} />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" asChild>
            <Link href={`/obras/${obra.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
