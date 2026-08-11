"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  STANDARD_ATTACHMENT_ACCEPT,
  STANDARD_ATTACHMENT_TYPES_LABEL,
} from "@/lib/form/attachment-allowed-types";
import { cn } from "@/lib/utils";

type CabinetUploadFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number }>;
  cancelHref: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CabinetUploadForm({ action, cancelHref }: CabinetUploadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (!result.ok) {
        setError(result.message ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      router.push("/modules/cabinet");
      router.refresh();
    } catch {
      setError("อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มเอกสาร</h2>

      <div className="space-y-2">
        <label htmlFor="docSubject" className="text-sm font-medium">
          ชื่อเรื่อง
        </label>
        <input
          id="docSubject"
          name="docSubject"
          required
          maxLength={150}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="file" className="text-sm font-medium">
          เอกสาร
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept={STANDARD_ATTACHMENT_ACCEPT}
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          รองรับ {STANDARD_ATTACHMENT_TYPES_LABEL} — สูงสุด 20MB
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังอัปโหลด…" : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border px-4 text-sm hover:bg-muted",
          )}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
