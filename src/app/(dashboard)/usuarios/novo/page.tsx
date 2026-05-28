"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/utils";
import { Role } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.nativeEnum(Role),
});

type FormData = z.infer<typeof schema>;

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: Role.VISUALIZACAO },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/usuarios");
    } else {
      const err = await res.json();
      setError(err.error?.formErrors?.[0] ?? "Erro ao salvar usuário.");
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/usuarios"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Usuário</h1>
          <p className="text-slate-500 text-sm">Criar acesso ao sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Usuário</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="João Silva" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" placeholder="joao@empresa.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso *</Label>
              <Select defaultValue={Role.VISUALIZACAO} onValueChange={(v) => setValue("role", v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            {error && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{error}</div>}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" asChild><Link href="/usuarios">Cancelar</Link></Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Criar Usuário
          </Button>
        </div>
      </form>
    </div>
  );
}
