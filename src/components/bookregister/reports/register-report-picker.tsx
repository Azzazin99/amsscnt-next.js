"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { RegisterReportKind } from "@/lib/bookregister/reports/columns";
import { cn } from "@/lib/utils";

const REPORT_OPTIONS: {
  kind: RegisterReportKind;
  label: string;
  description: string;
}[] = [
  {
    kind: "receive",
    label: "ทะเบียนรับ",
    description: "รายงานทะเบียนหนังสือรับตามแบบระเบียบ 2546",
  },
  {
    kind: "send",
    label: "ทะเบียนส่ง",
    description: "รายงานทะเบียนหนังสือส่งตามแบบระเบียบ 2546",
  },
  {
    kind: "command",
    label: "ทะเบียนคำสั่ง",
    description: "รายงานทะเบียนคำสั่งประจำปี",
  },
];

type RegisterReportPickerProps = {
  years: number[];
  defaultYear: number | null;
  kinds?: RegisterReportKind[];
};

export function RegisterReportPicker({
  years,
  defaultYear,
  kinds,
}: RegisterReportPickerProps) {
  const router = useRouter();
  const options = kinds
    ? REPORT_OPTIONS.filter((option) => kinds.includes(option.kind))
    : REPORT_OPTIONS;

  return (
    <form
      className="rounded-xl border bg-card p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const kind = String(data.get("kind") ?? "receive");
        const year = String(data.get("year") ?? "");
        if (!year) return;
        router.push(`/modules/bookregister/reports/${kind}?year=${year}`);
      }}
    >
      <fieldset className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">ชนิดทะเบียน</span>
          <select
            name="kind"
            defaultValue="receive"
            className="h-10 rounded-lg border border-input bg-background px-3"
          >
            {options.map((option) => (
              <option key={option.kind} value={option.kind}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">ปีทะเบียน (พ.ศ.)</span>
          <select
            name="year"
            defaultValue={defaultYear ?? years[years.length - 1] ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3"
            required
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {options.map((option) => (
          <li key={option.kind}>
            <strong className="text-foreground">{option.label}:</strong>{" "}
            {option.description}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="submit" className={cn(buttonVariants())}>
          เปิดรายงาน
        </button>
        <Link
          href="/modules/bookregister"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          กลับหน้าโมดูล
        </Link>
      </div>
    </form>
  );
}
