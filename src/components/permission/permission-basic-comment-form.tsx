"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionBasicCommentFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PermissionBasicCommentForm({
  action,
}: PermissionBasicCommentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
    >
      <h3 className="font-semibold text-primary">ความเห็นผู้บังคับบัญชาชั้นต้น</h3>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">ผลการพิจารณา</legend>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="basicGrant" value="1" required />
            เห็นชอบ
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="basicGrant" value="0" required />
            ไม่เห็นชอบ
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="basicComment" className="text-sm font-medium">
          ความเห็น
        </label>
        <input
          id="basicComment"
          name="basicComment"
          maxLength={200}
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังบันทึก…" : "บันทึกความเห็น"}
      </Button>
    </form>
  );
}
