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
import {
  ArrowLeft, Plus, Loader2, Pencil, Trash2, X, Check, FileText, Upload,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

const createSchema = z.object({
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  numeroNota: z.string().min(1, "Número obrigatório"),
  valor: z.string().min(1, "Valor obrigatório"),
  dataEmissao: z.string().min(1, "Data obrigatória"),
  dataVencimento: z.string().optional(),
  descricao: z.string().optional(),
});

const editSchema = z.object({
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  numeroNota: z.string().min(1, "Número obrigatório"),
  valor: z.string().min(1, "Valor obrigatório"),
  dataEmissao: z.string().min(1, "Data obrigatória"),
  dataVencimento: z.string().optional(),
  descricao: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGA", "CANCELADA"]),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

type Nota = {
  id: string;
  numeroNota: string;
  valor: string;
  dataEmissao: string;
  dataVencimento: string | null;
  descricao: string | null;
  status: string;
  pdfUrl: string | null;
  pdfNome: string | null;
  fornecedorId: string;
  fornecedor: { nome: string };
};

const STATUS_LABELS: Record<string, string> = { PENDENTE: "Pendente", PAGA: "Paga", CANCELADA: "Cancelada" };
const STATUS_VARIANT: Record<string, any> = { PENDENTE: "outline", PAGA: "success", CANCELADA: "destructive" };

function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function MateriaisPage() {
  const params = useParams();
  const obraId = params.id as string;

  const [notas, setNotas] = useState<Nota[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [obraInfo, setObraInfo] = useState<{ codigo: string; descricao: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createPdf, setCreatePdf] = useState<File | null>(null);
  const [editPdf, setEditPdf] = useState<File | null>(null);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  async function loadData() {
    const [obraRes, fornRes] = await Promise.all([
      fetch(`/api/obras/${obraId}`),
      fetch("/api/fornecedores"),
    ]);
    const obra = await obraRes.json();
    const forn = await fornRes.json();
    setObraInfo({ codigo: obra.codigo, descricao: obra.descricao });
    setNotas(obra.notasMaterial ?? []);
    setFornecedores(forn);
  }

  useEffect(() => { loadData(); }, [obraId]);

  async function onCreateSubmit(data: CreateFormData) {
    setCreateError("");
    const formData = new FormData();
    formData.append("obraId", obraId);
    formData.append("fornecedorId", data.fornecedorId);
    formData.append("numeroNota", data.numeroNota);
    formData.append("valor", data.valor);
    formData.append("dataEmissao", data.dataEmissao);
    if (data.dataVencimento) formData.append("dataVencimento", data.dataVencimento);
    if (data.descricao) formData.append("descricao", data.descricao);
    if (createPdf) formData.append("pdf", createPdf);

    const res = await fetch("/api/notas-material", { method: "POST", body: formData });
    if (res.ok) {
      createForm.reset();
      setCreatePdf(null);
      setShowCreateForm(false);
      loadData();
    } else {
      const err = await res.json();
      setCreateError(err.error?.formErrors?.[0] ?? "Erro ao salvar nota.");
    }
  }

  function startEdit(n: Nota) {
    editForm.reset({
      fornecedorId: n.fornecedorId,
      numeroNota: n.numeroNota,
      valor: String(Number(n.valor).toFixed(2)),
      dataEmissao: toDateInput(n.dataEmissao),
      dataVencimento: toDateInput(n.dataVencimento),
      descricao: n.descricao ?? "",
      status: n.status as EditFormData["status"],
    });
    setEditingId(n.id);
    setEditPdf(null);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditPdf(null);
    setEditError("");
    editForm.reset();
  }

  async function onEditSubmit(data: EditFormData) {
    if (!editingId) return;
    setEditError("");

    const formData = new FormData();
    formData.append("fornecedorId", data.fornecedorId);
    formData.append("numeroNota", data.numeroNota);
    formData.append("valor", data.valor);
    formData.append("dataEmissao", data.dataEmissao);
    formData.append("status", data.status);
    if (data.dataVencimento) formData.append("dataVencimento", data.dataVencimento);
    if (data.descricao) formData.append("descricao", data.descricao);
    if (editPdf) formData.append("pdf", editPdf);

    const res = await fetch(`/api/notas-material/${editingId}`, { method: "PUT", body: formData });
    if (res.ok) {
      cancelEdit();
      loadData();
    } else {
      const err = await res.json();
      setEditError(err.error?.formErrors?.[0] ?? "Erro ao salvar alterações.");
    }
  }

  async function handleDelete(notaId: string) {
    if (!confirm("Excluir esta nota? O saldo será recalculado.")) return;
    const res = await fetch(`/api/notas-material/${notaId}`, { method: "DELETE" });
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
          <h1 className="text-xl font-bold text-slate-800">Notas de Material</h1>
          <p className="text-sm text-slate-500">{obraInfo?.descricao}</p>
        </div>
        <Button className="ml-auto" onClick={() => { setShowCreateForm(!showCreateForm); setEditingId(null); }}>
          <Plus size={16} />
          Nova Nota
        </Button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader><CardTitle className="text-base">Nova Nota de Material / Faturamento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Select onValueChange={(v) => createForm.setValue("fornecedorId", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {createForm.formState.errors.fornecedorId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.fornecedorId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Número da Nota *</Label>
                  <Input placeholder="000123" {...createForm.register("numeroNota")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="0,00" {...createForm.register("valor")} />
                </div>
                <div className="space-y-2">
                  <Label>Emissão *</Label>
                  <Input type="date" {...createForm.register("dataEmissao")} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" {...createForm.register("dataVencimento")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={2} {...createForm.register("descricao")} />
              </div>
              <div className="space-y-2">
                <Label>PDF da Nota Fiscal</Label>
                <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-slate-50 text-sm w-fit">
                  <Upload size={14} />
                  {createPdf ? createPdf.name : "Selecionar PDF"}
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={(e) => setCreatePdf(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {createError && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">{createError}</div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); createForm.reset(); setCreatePdf(null); }}>
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

      {/* Lista de notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas Registradas ({notas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota registrada.</p>
          ) : (
            <div className="space-y-2">
              {notas.map((n) =>
                editingId === n.id ? (
                  /* ── Linha em modo edição ── */
                  <div key={n.id} className="border rounded-lg p-4 bg-amber-50/40 border-amber-200">
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Fornecedor *</Label>
                          <Select
                            defaultValue={n.fornecedorId}
                            onValueChange={(v) => editForm.setValue("fornecedorId", v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fornecedores.map((f) => (
                                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Número da Nota *</Label>
                          <Input className="h-8 text-sm" {...editForm.register("numeroNota")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select
                            defaultValue={n.status}
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
                        <div className="space-y-1">
                          <Label className="text-xs">Valor (R$) *</Label>
                          <Input type="number" step="0.01" className="h-8 text-sm" {...editForm.register("valor")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Emissão *</Label>
                          <Input type="date" className="h-8 text-sm" {...editForm.register("dataEmissao")} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Vencimento</Label>
                          <Input type="date" className="h-8 text-sm" {...editForm.register("dataVencimento")} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea rows={2} className="text-sm" {...editForm.register("descricao")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Substituir PDF</Label>
                        <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-slate-50 text-xs w-fit">
                          <Upload size={12} />
                          {editPdf ? editPdf.name : n.pdfNome ? `Atual: ${n.pdfNome}` : "Selecionar PDF"}
                          <input type="file" accept=".pdf" className="hidden"
                            onChange={(e) => setEditPdf(e.target.files?.[0] ?? null)} />
                        </label>
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
                  <div key={n.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">NF {n.numeroNota}</span>
                        <Badge variant={STATUS_VARIANT[n.status]}>{STATUS_LABELS[n.status]}</Badge>
                        {n.pdfUrl && (
                          <a href={n.pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                            <FileText size={11} />
                            PDF
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{n.fornecedor.nome}</p>
                      <p className="text-xs text-slate-400">
                        Emissão: {formatDate(n.dataEmissao)}
                        {n.dataVencimento && ` · Venc: ${formatDate(n.dataVencimento)}`}
                      </p>
                      {n.descricao && <p className="text-xs text-slate-400 truncate">{n.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <p className="font-bold text-sm">{formatCurrency(Number(n.valor))}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-blue-600"
                        onClick={() => startEdit(n)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(n.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )
              )}

              <div className="pt-3 border-t flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span>{formatCurrency(notas.reduce((s, n) => s + Number(n.valor), 0))}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
