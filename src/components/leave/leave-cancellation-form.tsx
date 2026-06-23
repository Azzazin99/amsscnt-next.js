"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/format/thai-date";
import { formDataToObject, zodFieldErrors } from "@/lib/form/zod-client";
import type { LeaveApproverOption } from "@/lib/leave/form-context-shared";
import type { EligibleLeaveForCancellation } from "@/lib/leave/queries";
import { leaveCancellationCreateSchema } from "@/lib/leave/schemas";
import { computeLeaveTotal } from "@/lib/leave/regulation/validation";
import { cn } from "@/lib/utils";

type LeaveCancellationFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  officeName: string;
  eligibleRequests: EligibleLeaveForCancellation[];
  approverOptions: LeaveApproverOption[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LeaveCancellationForm({
  action,
  cancelHref,
  officeName,
  eligibleRequests,
  approverOptions,
}: LeaveCancellationFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceRequestId, setSourceRequestId] = useState(
    eligibleRequests[0]?.id ? String(eligibleRequests[0].id) : "",
  );
  const [cancelStart, setCancelStart] = useState("");
  const [cancelFinish, setCancelFinish] = useState("");

  const selected = useMemo(
    () => eligibleRequests.find((r) => String(r.id) === sourceRequestId) ?? null,
    [eligibleRequests, sourceRequestId],
  );

  const cancelTotal = useMemo(() => {
    if (!cancelStart || !cancelFinish) return null;
    try {
      return computeLeaveTotal(cancelStart, cancelFinish, null);
    } catch {
      return null;
    }
  }, [cancelStart, cancelFinish]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = leaveCancellationCreateSchema.safeParse(
      formDataToObject(formData),
    );
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const result = await action(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  if (eligibleRequests.length === 0) {
    return (
      <section className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold text-primary">บันทึกขอยกเลิกวันลา</h2>
        <p className="text-sm text-muted-foreground">
          ไม่มีคำขอลาที่อนุมัติแล้วที่สามารถยกเลิกได้
        </p>
        <Link href={cancelHref} className="text-sm text-primary hover:underline">
          ← กลับรายการ
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">บันทึกขอยกเลิกวันลา</h2>
        <Link href={cancelHref} className="text-sm text-primary hover:underline">
          ← กลับรายการ
        </Link>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="writeAt" className="text-sm font-medium">
            เขียนที่
          </label>
          <input
            id="writeAt"
            name="writeAt"
            defaultValue={officeName}
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div
          className={cn(
            "space-y-2",
            fieldErrors.sourceRequestId && "rounded-lg border border-destructive p-2",
          )}
        >
          <label htmlFor="sourceRequestId" className="text-sm font-medium">
            อ้างอิงคำขอลาที่อนุมัติแล้ว
          </label>
          <select
            id="sourceRequestId"
            name="sourceRequestId"
            value={sourceRequestId}
            onChange={(e) => {
              setSourceRequestId(e.target.value);
              setCancelStart("");
              setCancelFinish("");
            }}
            className={inputClass}
          >
            {eligibleRequests.map((req) => (
              <option key={req.id} value={req.id}>
                {req.leaveTypeLabel} · {formatThaiDate(req.leaveStart)} –{" "}
                {formatThaiDate(req.leaveFinish)} ({req.leaveTotal} วัน)
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.sourceRequestId} />
        </div>

        {selected ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-primary">ช่วงลาที่อนุมัติแล้ว</p>
            <p className="mt-2 text-muted-foreground">
              {selected.leaveTypeLabel} · {formatThaiDate(selected.leaveStart)} –{" "}
              {formatThaiDate(selected.leaveFinish)} · {selected.leaveTotal} วัน
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-2",
            fieldErrors.because && "rounded-lg border border-destructive p-2",
          )}
        >
          <label htmlFor="because" className="text-sm font-medium">
            เหตุผลที่ขอยกเลิก
          </label>
          <textarea
            id="because"
            name="because"
            rows={3}
            maxLength={200}
            className={cn(inputClass, "h-auto min-h-[80px] py-2")}
          />
          <FieldError message={fieldErrors.because} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className={cn(
              "space-y-2",
              fieldErrors.cancelStart && "rounded-lg border border-destructive p-2",
            )}
          >
            <label className="text-sm font-medium">ยกเลิกตั้งแต่วันที่</label>
            <ThaiDatePicker
              key={`cancel-start-${sourceRequestId}`}
              name="cancelStart"
              defaultValue={cancelStart}
              minIso={selected?.leaveStart}
              onChange={(iso) => {
                setCancelStart(iso);
                if (!cancelFinish || iso > cancelFinish) setCancelFinish(iso);
              }}
              error={fieldErrors.cancelStart}
            />
          </div>
          <div
            className={cn(
              "space-y-2",
              fieldErrors.cancelFinish && "rounded-lg border border-destructive p-2",
            )}
          >
            <label className="text-sm font-medium">ถึงวันที่</label>
            <ThaiDatePicker
              key={`cancel-finish-${sourceRequestId}-${cancelStart}`}
              name="cancelFinish"
              defaultValue={cancelFinish}
              minIso={cancelStart || selected?.leaveStart}
              onChange={setCancelFinish}
              error={fieldErrors.cancelFinish}
            />
          </div>
        </div>

        {cancelTotal !== null ? (
          <p className="text-sm text-muted-foreground">
            จำนวนวันที่ยกเลิก: <strong>{cancelTotal}</strong> วัน
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading} className="min-h-11">
            {loading ? "กำลังบันทึก…" : "บันทึกขอยกเลิกวันลา"}
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
    </section>
  );
}
