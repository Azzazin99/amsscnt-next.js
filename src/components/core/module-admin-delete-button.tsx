"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  id: number;
  deleteAction: (id: number) => Promise<{ ok: boolean; message?: string }>;
};

export function ModuleAdminDeleteButton({ id, deleteAction }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm("ลบผู้ดูแลโมดูลนี้?")) return;
    setLoading(true);
    try {
      const result = await deleteAction(id);
      if (!result.ok) {
        alert(result.message ?? "ลบไม่สำเร็จ");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={handleClick}>
      {loading ? "..." : "ลบ"}
    </Button>
  );
}
