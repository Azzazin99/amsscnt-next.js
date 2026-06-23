"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import {
  SECRET_LEVELS,
  URGENCY_LEVELS,
} from "@/lib/bookregister/regulation-fields";
import type { BookScope } from "@/lib/book/scope";

type SchoolOption = { id: number; schoolCode: string; name: string };
type GroupOption = { id: number; name: string };

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number }>;
  scope: BookScope;
  schools: SchoolOption[];
  groups: GroupOption[];
  defaultSignDate: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BookComposeForm({
  action,
  scope,
  schools,
  groups,
  defaultSignDate,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCirculation, setIsCirculation] = useState(false);
  const [recipientMode, setRecipientMode] = useState(
    scope.kind === "school" ? "saraban" : "all_schools",
  );

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
      if (result.id) {
        router.push(`/modules/book/${result.id}`);
        router.refresh();
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">ส่งหนังสือใหม่</h2>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-medium">
        <input
          type="checkbox"
          name="isCirculation"
          checked={isCirculation}
          onChange={(e) => setIsCirculation(e.target.checked)}
          className="size-4 rounded border"
        />
        หนังสือเวียน
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bookNo" className="text-sm font-medium">
            เลขที่หนังสือ
          </label>
          <input
            id="bookNo"
            name="bookNo"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signDate" className="text-sm font-medium">
            ลงวันที่
          </label>
          <ThaiDatePicker
            id="signDate"
            name="signDate"
            defaultValue={defaultSignDate}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          เรื่อง
        </label>
        <input id="subject" name="subject" required maxLength={500} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="detail" className="text-sm font-medium">
          รายละเอียด
        </label>
        <textarea
          id="detail"
          name="detail"
          rows={4}
          className={`${inputClass} min-h-[6rem] py-2`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="urgencyLevel" className="text-sm font-medium">
            ชั้นความเร็ว
          </label>
          <select
            id="urgencyLevel"
            name="urgencyLevel"
            defaultValue="1"
            className={inputClass}
          >
            {URGENCY_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="secretLevel" className="text-sm font-medium">
            ชั้นความลับ
          </label>
          <select
            id="secretLevel"
            name="secretLevel"
            defaultValue="0"
            className={inputClass}
          >
            {SECRET_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`space-y-2 rounded-lg border p-4 ${isCirculation ? "border-primary ring-2 ring-primary/20" : ""}`}
      >
        <label htmlFor="recipientMode" className="text-sm font-medium">
          {isCirculation ? "รายชื่อผู้รับ (หนังสือเวียน)" : "ส่งถึง"}
        </label>
        <select
          id="recipientMode"
          name="recipientMode"
          value={recipientMode}
          onChange={(e) => setRecipientMode(e.target.value)}
          className={inputClass}
        >
          {scope.kind === "school" ? (
            <option value="saraban">สำนักงานเขต (สารบรรณ)</option>
          ) : null}
          <option value="all_schools">โรงเรียนทั้งหมด</option>
          <option value="selected_schools">เลือกโรงเรียน</option>
          <option value="book_group">กลุ่มหนังสือ</option>
        </select>

        {recipientMode === "book_group" ? (
          <div className="space-y-1 pt-2">
            <label htmlFor="groupId" className="text-sm text-muted-foreground">
              กลุ่มหนังสือ
            </label>
            <select id="groupId" name="groupId" required className={inputClass}>
              <option value="">เลือกกลุ่ม</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {recipientMode === "selected_schools" ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2 pt-2">
            {schools.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-start gap-2 text-sm"
              >
                <input type="checkbox" name="schoolIds" value={s.id} />
                <span>
                  {s.schoolCode} {s.name}
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังส่ง..." : isCirculation ? "บันทึกหนังสือเวียน" : "บันทึกส่งหนังสือ"}
        </Button>
        <Link
          href="/modules/book/sent"
          className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted"
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
