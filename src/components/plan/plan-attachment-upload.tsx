"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadPlanProjectAttachment } from "@/lib/plan/smss-import";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ProjectOption = { id: number; codeProj: string; nameProj: string };

export function PlanAttachmentUpload({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setMessage(null);
    setLoading(true);
    try {
      const result = await uploadPlanProjectAttachment(new FormData(form));
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "แนบไฟล์ไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
    >
      <div className="min-w-[240px] flex-1 space-y-1">
        <label htmlFor="projectId" className="text-xs font-medium">
          โครงการ
        </label>
        <select id="projectId" name="projectId" required defaultValue="" className={inputClass}>
          <option value="">— เลือกโครงการ —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codeProj} {p.nameProj}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[220px] space-y-1">
        <label htmlFor="file" className="text-xs font-medium">
          ไฟล์เอกสาร
        </label>
        <input id="file" name="file" type="file" required className={cn(inputClass, "py-2")} />
      </div>

      {message ? (
        <p
          className={cn(
            "w-full text-sm",
            message.ok ? "text-primary" : "text-destructive",
          )}
          role="alert"
        >
          {message.text}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังแนบ…" : "แนบไฟล์"}
      </Button>
    </form>
  );
}
