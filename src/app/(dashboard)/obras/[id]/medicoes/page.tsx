"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

const createSchema = z.object({
  numero: z.string().min(1, "Número obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.string().min(1, "Valor obrigatório"),
  dataEmissao: z.string().min(1, "Data obrigatória"),
  observacoes: z.string().optional(),
});

const editSchema = z.object({
  numero: z.string().min(1, "Número obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.string().min(1, "Valor obrigatório"),
  dataEmissao: z.string().min(1, "Data obrigatória"),
  dataPagamento: z.string().optional(),
  status: z.enum(["PENDENTE", "APROVADA", "PAGA", "CANCELADA"]),
  observacoes: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

type Medicao = {
  id: string;
  numero: number;
  descricao: string;
  valor: string;
  dataEmissao: string;
  dataPagamento: string | null;
  status: string;
  observacoes?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};
const STATUS_VARIANT: Record<string, any> = {
  PENDENTE: "outline",
  APROVADA: "info",
  PAGA: "success",
  CANCELADA: "destructive",
};

function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function MedicoesPage() {
  const params = useParams();
  const obraId = params.id as string;

  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [obraInfo, setObraInfo] = useState<{ codigo: string; descricao: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  async function loadData() {
    const res = await fetch(`/api/obras/${obraId}`);
    const obra = await res.json();
    setObraInfo({ codigo: obra.codigo, descricao: obra.descricao });
    setMedicoes(obra.medicoes ?? []);
  }

  useEffect(() => { loadData(); }, [obraId]);

  async function onCreateSubmit(data: CreateFormData) {
    setCreateError("");
    const res = await fetch("/api/medicoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obraId,
        numero: parseInt(data.numero),
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        dataEmissao: data.dataEmissao,
        observacoes: data.observacoes || null,
      }),
    });

    if (res.ok) {
      createForm.reset();
      setShowCreateForm(false);
      loadData();
    } else {
      const err = await res.json();
      setCreateError(err.error?.formErrors?.[0] ?? "Erro ao salvar medição.");
    }
  }

  function startEdit(m: Medicao) {
    editForm.reset({
      numero: String(m.numero),
      descricao: m.descricao,
      valor: String(Number(m.valor).toFixed(2)),
      dataEmissao: toDateInput(m.dataEmissao),
      dataPagamento: toDateInput(m.dataPagamento),
      status: m.status as EditFormData["status"],
      observacoes: m.observacoes ?? "",
    });
    setEditingId(m.id);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
    editForm.reset();
  }

  async function onEditSubmit(data: EditFormData) {
    if (!editingId) return;
    setEditError("");
    const res = await fetch(`/api/medicoes/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numero: parseInt(data.numero),
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        dataEmissao: data.dataEmissao,
        dataPagamento: data.dataPagamento || null,
        status: data.status,
        observacoes: data.observacoes || null,
      }),
    });

    if (res.ok) {
      cancelEdit();
      loadData();
    } else {
      const err = await res.json();
      setEditError(err.error?.formErrors?.[0] ?? "Erro ao salvar alterações.");
    }
  }

  async function handleDelete(medicaoId: string) {
    if (!confirm("Excluir esta medição? O saldo será recalculado.")) return;
    const res = await fetch(`/api/medicoes/${medicaoId}`, { method: "DELETE" });
    if (res.ok) loadData();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/obras/${obraId}`}><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <p className="text-xs text-slate-500">{obraInfo?.codigo}</p>
          <h1 className="text-xl font-bold text-slate-800">Medições de Mão de Obra</h1>
          <p className="text-sm text-slate-500">{obraInfo?.descricao}</p>
        </div>
        <Button className="ml-auto" onClick={() => { setShowCreateForm(!showCreateForm); setEditingId(null); }}>
          <Plus size={16} />
          Nova Medição
        </Button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader><CardTitle className="text-base">Nova Medição</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input type="number" placeholder="1" {...createForm.register("numero")} />
                  {createForm.formState.errors.numero && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.numero.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Data de Emissão *</Label>
                  <Input type="date" {...createForm.register("dataEmissao")} />
                  {createForm.formState.errors.dataEmissao && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.dataEmissao.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input placeholder="Ex: Serviços de impermeabilização..." {...createForm.register("descricao")} />
                {createForm.formState.errors.descricao && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.descricao.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...createForm.register("valor")} />
                {createForm.formState.errors.valor && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.valor.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea rows={2} {...createForm.register("observacoes")} />
              </div>
              {createError && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{createError}</div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); createForm.reset(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de medições */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Medições Registradas ({medicoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma medição registrada.</p>
          ) : (
            <div className="space-y-2">
              {medicoes.map((m) =>
                editingId === m.id ? (
                  /* ── Linha em modo edição ── */
                  <div key={m.id} className="border rounded-lg p-4 bg-amber-50/40 border-amber-200">
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Número *</Label>
                          <Input type="number" className="h-8 text-sm" {...editForm.register("numero")} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select
                            defaultValue={m.status}
                            onValueChange={(v) => editForm.setValue("status", v as EditFormData["status"])}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição *</Label>
                        <Input className="h-8 text-sm" {...editForm.register("descricao")} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Valor (R$) *</Label>
                          <Input type="number" step="0.01" className="h-8 text-sm" {...editForm.register("valor")} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Emissão *</Label>
                          <Input type="date" className="h-8 text-sm" {...editForm.register("dataEmissao")} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Pagamento</Label>
                          <Input type="date" className="h-8 text-sm" {...editForm.register("dataPagamento")} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Observações</Label>
                        <Textarea rows={2} className="text-sm" {...editForm.register("observacoes")} />
                      </div>
                      {editError && (
                        <div className="bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-md">{editError}</div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                          <X size={13} />
                          Cancelar
                        </Button>
                        <Button type="submit" size="sm" disabled={editForm.formState.isSubmitting}>
                          {editForm.formState.isSubmitting
                            ? <Loader2 size={13} className="animate-spin mr-1" />
                            : <Check size={13} className="mr-1" />
                          }
                          Salvar
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ── Linha normal ── */
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Medição #{m.numero}</span>
                        <Badge variant={STATUS_VARIANT[m.status]}>{STATUS_LABELS[m.status]}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{m.descricao}</p>
                      <p className="text-xs text-slate-400">
                        Emissão: {formatDate(m.dataEmissao)}
                        {m.dataPagamento && ` · Pgto: ${formatDate(m.dataPagamento)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <p className="font-bold text-sm">{formatCurrency(Number(m.valor))}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-blue-600"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )
              )}

              <div className="pt-3 border-t flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span>{formatCurrency(medicoes.reduce((s, m) => s + Number(m.valor), 0))}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
