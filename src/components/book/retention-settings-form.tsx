"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  bookType: number;
  label: string;
  retentionYears: number;
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

export function RetentionSettingsForm({
  bookType,
  label,
  retentionYears,
  action,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
    >
      <input type="hidden" name="bookType" value={bookType} />
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor={`years-${bookType}`} className="text-xs text-muted-foreground">
          ปี
        </label>
        <input
          id={`years-${bookType}`}
          name="retentionYears"
          type="number"
          min={1}
          max={99}
          defaultValue={retentionYears}
          required
          className="h-9 w-20 rounded-lg border px-2 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "..." : "บันทึก"}
      </Button>
      {error ? (
        <p className="w-full text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
