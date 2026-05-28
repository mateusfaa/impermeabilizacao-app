"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  contratante: {
    id: string;
    nome: string;
    cpfCnpj: string;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
  };
}

export default function EditarContratanteForm({ contratante }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: contratante.nome,
      cpfCnpj: contratante.cpfCnpj,
      email: contratante.email ?? "",
      telefone: contratante.telefone ?? "",
      endereco: contratante.endereco ?? "",
      cidade: contratante.cidade ?? "",
      estado: contratante.estado ?? "",
      cep: contratante.cep ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch(`/api/contratantes/${contratante.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
      }),
    });

    if (res.ok) {
      router.push("/contratantes");
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
          <Link href="/contratantes">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Editar Contratante</h1>
          <p className="text-slate-500 text-sm">{contratante.nome}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Contratante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input {...register("nome")} />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>CPF / CNPJ *</Label>
                <Input {...register("cpfCnpj")} />
                {errors.cpfCnpj && (
                  <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register("telefone")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>E-mail</Label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Endereço</Label>
                <Input {...register("endereco")} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...register("cidade")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input maxLength={2} {...register("estado")} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input {...register("cep")} />
                </div>
              </div>
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
            <Link href="/contratantes">Cancelar</Link>
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
