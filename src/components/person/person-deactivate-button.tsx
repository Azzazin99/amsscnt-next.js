"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
      className="text-xs text-destructive hover:underline disabled:opacity-50"
    >
      {loading ? "…" : "ปิดใช้งาน"}
    </button>
  );
}
