"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PersonOption } from "@/lib/mail/queries";

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number } | void>;
  deleteAction?: () => Promise<{ ok: boolean; message?: string }>;
  title: string;
  cancelHref: string;
  mode: "create" | "edit";
  people: PersonOption[];
  defaultValues?: {
    name?: string;
    sortOrder?: number;
    personIds?: string[];
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MailGroupForm({
  action,
  deleteAction,
  title,
  cancelHref,
  mode,
  people,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (
        mode === "create" &&
        result &&
        "ok" in result &&
        result.ok &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        router.push(`/modules/mail/groups/${result.id}/edit`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("ลบกลุ่มบุคลากรนี้?")) return;
    setDeleting(true);
    try {
      const result = await deleteAction();
      if (!result.ok) {
        setError(result.message ?? "ลบไม่สำเร็จ");
        return;
      }
      router.push("/modules/mail/groups");
      router.refresh();
    } catch {
      setError("ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อกลุ่ม
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={255}
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sortOrder" className="text-sm font-medium">
          ลำดับ
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          defaultValue={defaultValues?.sortOrder ?? 0}
          className={inputClass}
        />
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <span className="text-sm font-medium">สมาชิก</span>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {people.map((p) => (
            <label
              key={p.personId}
              className="flex cursor-pointer items-start gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="personIds"
                value={p.personId}
                defaultChecked={defaultValues?.personIds?.includes(p.personId)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted"
        >
          ย้อนกลับ
        </Link>
        {mode === "edit" && deleteAction ? (
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "กำลังลบ..." : "ลบกลุ่ม"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
