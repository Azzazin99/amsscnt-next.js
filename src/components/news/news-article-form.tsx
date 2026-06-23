"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsSectionRow } from "@/lib/news/queries";

type NewsArticleFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number }>;
  sections: NewsSectionRow[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    sectionCode: number;
    news: string;
    hasFile: boolean;
  };
};

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function NewsArticleForm({
  action,
  sections,
  title,
  cancelHref,
  defaultValues,
}: NewsArticleFormProps) {
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
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(cancelHref);
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="sectionCode" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="sectionCode"
          name="sectionCode"
          required
          defaultValue={defaultValues?.sectionCode ?? ""}
          className={cn(inputClass, "h-10")}
        >
          <option value="">— เลือก —</option>
          {sections.map((s) => (
            <option key={s.id} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="news" className="text-sm font-medium">
          ข้อความข่าว
        </label>
        <textarea
          id="news"
          name="news"
          required
          maxLength={250}
          rows={4}
          defaultValue={defaultValues?.news ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="file" className="text-sm font-medium">
          ไฟล์เอกสาร
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
          className="block w-full text-sm"
        />
        {defaultValues?.hasFile ? (
          <p className="text-xs text-muted-foreground">
            มีไฟล์แนบอยู่แล้ว — อัปโหลดใหม่เพื่อแทนที่
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
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
