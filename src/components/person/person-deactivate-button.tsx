"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { deactivatePerson } from "@/lib/person/actions";

type PersonDeactivateButtonProps = {
  id: number;
};

export function PersonDeactivateButton({ id }: PersonDeactivateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("ปิดใช้งานบุคลากรรายนี้?")) return;
    setLoading(true);
    try {
      const result = await deactivatePerson(id);
      if (!result.ok) {
        alert(result.message ?? "ไม่สำเร็จ");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex size-7 items-center justify-center rounded transition-all hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
      aria-label="ลบ"
      title="ลบ / ปิดใช้งาน"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin text-red-600 dark:text-red-400" />
      ) : (
        <X className="size-5 font-bold text-red-600 hover:scale-110 dark:text-red-400" />
      )}
    </button>
  );
}
