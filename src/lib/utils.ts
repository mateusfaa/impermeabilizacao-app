import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatCpfCnpj(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function calcularPercentual(usado: number | string, total: number | string): number {
  const u = typeof usado === "string" ? parseFloat(usado) : usado;
  const t = typeof total === "string" ? parseFloat(total) : total;
  if (t === 0) return 0;
  return Math.round((u / t) * 100);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRADOR: "Administrador",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional",
  VISUALIZACAO: "Visualização",
};

export function canEdit(role: Role): boolean {
  return role === Role.ADMINISTRADOR || role === Role.OPERACIONAL || role === Role.FINANCEIRO;
}

export function canDelete(role: Role): boolean {
  return role === Role.ADMINISTRADOR;
}

export function canManageUsers(role: Role): boolean {
  return role === Role.ADMINISTRADOR;
}
