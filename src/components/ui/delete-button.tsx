"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
  apiUrl: string;
  confirmMessage: string;
  disabled?: boolean;
  disabledTitle?: string;
  className?: string;
}

export function DeleteButton({
  apiUrl,
  confirmMessage,
  disabled = false,
  disabledTitle,
  className,
}: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erro ao excluir. Verifique se não há registros vinculados.");
      }
    } catch {
      alert("Erro de conexão ao tentar excluir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 text-slate-500 hover:text-red-600 ${className ?? ""}`}
      onClick={handleDelete}
      disabled={loading || disabled}
      title={disabled ? disabledTitle : "Excluir"}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </Button>
  );
}
