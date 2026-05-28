"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  codigo: z.string().min(1, "Código obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  contratanteId: z.string().min(1, "Contratante obrigatório"),
  valorContrato: z.string().min(1, "Valor obrigatório"),
  saldoMaoDeObra: z.string().min(1, "Saldo M.O. obrigatório"),
  saldoMaterial: z.string().min(1, "Saldo material obrigatório"),
  dataInicio: z.string().optional(),
  dataFimPrevisto: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NovaObraPage() {
  const router = useRouter();
  const [contratantes, setContratantes] = useState<{ id: string; nome: string }[]>([]);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/contratantes")
      .then((r) => r.json())
      .then(setContratantes);
  }, []);

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        razaoSocial: data.razaoSocial || null,
        cnpj: data.cnpj || null,
        valorContrato: parseFloat(data.valorContrato),
        saldoMaoDeObra: parseFloat(data.saldoMaoDeObra),
        saldoMaterial: parseFloat(data.saldoMaterial),
        dataInicio: data.dataInicio || null,
        dataFimPrevisto: data.dataFimPrevisto || null,
        observacoes: data.observacoes || null,
      }),
    });

    if (res.ok) {
      const obra = await res.json();
      router.push(`/obras/${obra.id}`);
    } else {
      const err = await res.json();
      setError(err.error?.formErrors?.[0] ?? "Erro ao salvar obra.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/obras">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nova Obra</h1>
          <p className="text-slate-500 text-sm">Preencha os dados do contrato</p>
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
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" placeholder="OBR-2024-001" {...register("codigo")} />
                {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contratanteId">Contratante *</Label>
                <Select onValueChange={(v) => setValue("contratanteId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contratantes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contratanteId && <p className="text-xs text-destructive">{errors.contratanteId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Obra *</Label>
              <Input id="descricao" placeholder="Ex: Impermeabilização Cobertura Edifício..." {...register("descricao")} />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social da Obra</Label>
                <Input id="razaoSocial" placeholder="Ex: Construtora XYZ Ltda." {...register("razaoSocial")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Obra</Label>
                <Input id="cnpj" placeholder="00.000.000/0001-00" {...register("cnpj")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorContrato">Valor Total (R$) *</Label>
                <Input id="valorContrato" type="number" step="0.01" placeholder="0,00" {...register("valorContrato")} />
                {errors.valorContrato && <p className="text-xs text-destructive">{errors.valorContrato.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoMaoDeObra">Saldo Mão de Obra (R$) *</Label>
                <Input id="saldoMaoDeObra" type="number" step="0.01" placeholder="0,00" {...register("saldoMaoDeObra")} />
                {errors.saldoMaoDeObra && <p className="text-xs text-destructive">{errors.saldoMaoDeObra.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldoMaterial">Saldo Material (R$) *</Label>
                <Input id="saldoMaterial" type="number" step="0.01" placeholder="0,00" {...register("saldoMaterial")} />
                {errors.saldoMaterial && <p className="text-xs text-destructive">{errors.saldoMaterial.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input id="dataInicio" type="date" {...register("dataInicio")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFimPrevisto">Previsão de Término</Label>
                <Input id="dataFimPrevisto" type="date" {...register("dataFimPrevisto")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" placeholder="Informações adicionais..." rows={3} {...register("observacoes")} />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" asChild>
            <Link href="/obras">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Salvar Obra
          </Button>
        </div>
      </form>
    </div>
  );
}
