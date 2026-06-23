"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  documentId: number;
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  defaultAutoRegister?: boolean;
};

export function BookAckButton({
  documentId,
  action,
  defaultAutoRegister = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRegister, setAutoRegister] = useState(defaultAutoRegister);

  async function handleAck() {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("documentId", String(documentId));
      if (autoRegister) {
        formData.set("autoRegister", "true");
      }
      const result = await action(formData);
      if (!result.ok) {
        setError(result.message ?? "ตอบรับไม่สำเร็จ");
        return;
      }
      router.refresh();
    } catch {
      setError("ตอบรับไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoRegister}
          onChange={(e) => setAutoRegister(e.target.checked)}
          className="size-4 rounded border"
        />
        ลงทะเบียนรับอัตโนมัติ
      </label>
      <Button type="button" onClick={handleAck} disabled={loading}>
        {loading ? "กำลังบันทึก..." : "ตอบรับหนังสือ"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
