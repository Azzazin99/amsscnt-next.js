"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  id: number;
  deleteAction: (id: number) => Promise<void>;
  label?: string;
};

export function CarDeleteButton({ id, deleteAction, label = "ลบ" }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="min-h-11 text-destructive hover:text-destructive"
      onClick={() => {
        if (!confirm("ยืนยันการลบ?")) return;
        startTransition(() => deleteAction(id));
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}
