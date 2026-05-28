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

export default function NovoContratantePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/contratantes", {
      method: "POST",
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
    } else {
      const err = await res.json();
      setError(err.error?.formErrors?.[0] ?? "Erro ao salvar.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contratantes"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Contratante</h1>
          <p className="text-slate-500 text-sm">Cadastrar cliente / contratante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Contratante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input placeholder="Construtora Exemplo Ltda" {...register("nome")} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CPF / CNPJ *</Label>
                <Input placeholder="00.000.000/0001-00" {...register("cpfCnpj")} />
                {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-9999" {...register("telefone")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>E-mail</Label>
                <Input type="email" placeholder="contato@empresa.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Endereço</Label>
                <Input placeholder="Rua, número" {...register("endereco")} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input placeholder="São Paulo" {...register("cidade")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input placeholder="SP" maxLength={2} {...register("estado")} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input placeholder="00000-000" {...register("cep")} />
                </div>
              </div>
            </div>
            {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" asChild><Link href="/contratantes">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
