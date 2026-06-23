"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ACHIEVEMENT_ONET_CLASSES,
  ACHIEVEMENT_TEST_TYPES,
} from "@/lib/achievement/constants";
import { cn } from "@/lib/utils";

type SchoolOption = { schoolCode: string; name: string };

type Props = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string } | void>;
  title: string;
  cancelHref: string;
  schools: SchoolOption[];
  defaultValues?: {
    testType: number;
    testClass: number;
    edYear: number;
    schoolCode: string;
    thai: number;
    math: number;
    science: number;
    social: number;
    english: number;
    health: number;
    art: number;
    vocation: number;
  };
  lockKeys?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SCORE_FIELDS = [
  ["thai", "ภาษาไทย"],
  ["math", "คณิตศาสตร์"],
  ["science", "วิทยาศาสตร์"],
  ["social", "สังคมศึกษา"],
  ["english", "ภาษาอังกฤษ"],
  ["health", "สุขศึกษา"],
  ["art", "ศิลปะ"],
  ["vocation", "การงาน"],
] as const;

export function AchievementScoreForm({
  action,
  title,
  cancelHref,
  schools,
  defaultValues,
  lockKeys = false,
}: Props) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="testType" className="text-sm font-medium">
            ประเภทการสอบ
          </label>
          <select
            id="testType"
            name="testType"
            required
            disabled={lockKeys}
            defaultValue={defaultValues?.testType ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {ACHIEVEMENT_TEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="testClass" className="text-sm font-medium">
            ชั้น
          </label>
          <select
            id="testClass"
            name="testClass"
            required
            disabled={lockKeys}
            defaultValue={defaultValues?.testClass ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {ACHIEVEMENT_ONET_CLASSES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="edYear" className="text-sm font-medium">
            ปีการศึกษา (พ.ศ.)
          </label>
          <input
            id="edYear"
            name="edYear"
            type="number"
            required
            disabled={lockKeys}
            defaultValue={defaultValues?.edYear ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="schoolCode" className="text-sm font-medium">
            โรงเรียน
          </label>
          <select
            id="schoolCode"
            name="schoolCode"
            required
            disabled={lockKeys}
            defaultValue={defaultValues?.schoolCode ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {schools.map((s) => (
              <option key={s.schoolCode} value={s.schoolCode}>
                {s.name} ({s.schoolCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SCORE_FIELDS.map(([name, label]) => (
          <div key={name} className="space-y-2">
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={name}
              name={name}
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              defaultValue={
                defaultValues?.[name as keyof typeof defaultValues] ?? 0
              }
              className={inputClass}
            />
          </div>
        ))}
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
