"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function MarkAlertasRead({ ids }: { ids: string[] }) {
  const router = useRouter();

  async function handleMarkAll() {
    await fetch("/api/alertas/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAll}>
      Marcar todos como lidos
    </Button>
  );
}
