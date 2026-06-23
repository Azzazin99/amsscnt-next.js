"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import type {
  RecipientOption,
  WorkgroupOption,
} from "@/lib/idocument/queries";
import { cn } from "@/lib/utils";

type IdocumentFormProps = {
  title: string;
  cancelHref: string;
  action: (formData: FormData) => Promise<{ ok: false; message: string } | void>;
  workgroups: WorkgroupOption[];
  recipients: RecipientOption[];
  defaultValues: {
    workgroup: number;
    workgroupTxt: string;
    subject: string;
    bookTo: string;
    content1: string;
    content2: string;
    content3: string;
    bookType: number;
    recipientPersonId: string;
  };
  defaultBookTo?: string;
};

export function IdocumentForm({
  title,
  cancelHref,
  action,
  workgroups,
  recipients,
  defaultValues,
  defaultBookTo,
}: IdocumentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<"draft" | "submit">("draft");
  const [workgroupTxt, setWorkgroupTxt] = useState(defaultValues.workgroupTxt);
  const [bookTo, setBookTo] = useState(
    defaultValues.bookTo || defaultBookTo || "",
  );

  function handleWorkgroupChange(workgroup: string) {
    const selected = workgroups.find(
      (wg) => String(wg.legacyCode) === workgroup,
    );
    setWorkgroupTxt(selected?.label ?? "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("workgroupTxt", workgroupTxt);
    formData.set("submitMode", submitMode);

    startTransition(async () => {
      const result = await action(formData);
      if (result && !result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-card p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="workgroup" className="text-sm font-medium">
              ส่วนราชการ
            </label>
            <select
              id="workgroup"
              name="workgroup"
              required
              defaultValue={defaultValues.workgroup || ""}
              onChange={(e) => handleWorkgroupChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                เลือกส่วนราชการ
              </option>
              {workgroups.map((wg) => (
                <option key={wg.legacyCode} value={wg.legacyCode}>
                  {wg.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">ความเร่งด่วน</span>
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              {[
                { value: 0, label: "ปกติ" },
                { value: 1, label: "ด่วน" },
                { value: 2, label: "ด่วนที่สุด" },
                { value: 3, label: "ลับ" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="bookType"
                    value={opt.value}
                    defaultChecked={defaultValues.bookType === opt.value}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="subject" className="text-sm font-medium">
              เรื่อง
            </label>
            <input
              id="subject"
              name="subject"
              required
              defaultValue={defaultValues.subject}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="bookTo" className="text-sm font-medium">
              เรียน
            </label>
            <input
              id="bookTo"
              name="bookTo"
              required
              value={bookTo}
              onChange={(e) => setBookTo(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="content1" className="text-sm font-medium">
              เรื่องเดิม
            </label>
            <textarea
              id="content1"
              name="content1"
              required
              rows={4}
              defaultValue={defaultValues.content1}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="content2" className="text-sm font-medium">
              ข้อเท็จจริง
            </label>
            <textarea
              id="content2"
              name="content2"
              required
              rows={4}
              defaultValue={defaultValues.content2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="content3" className="text-sm font-medium">
              จึงเรียนมาเพื่อ
            </label>
            <textarea
              id="content3"
              name="content3"
              required
              rows={3}
              defaultValue={defaultValues.content3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="recipientPersonId" className="text-sm font-medium">
              ผู้รับเสนอ (สำหรับเสนอเอกสาร)
            </label>
            <select
              id="recipientPersonId"
              name="recipientPersonId"
              required
              defaultValue={defaultValues.recipientPersonId || ""}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                เลือกผู้รับเสนอ
              </option>
              {recipients.map((person) => (
                <option key={person.personId} value={person.personId}>
                  {person.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            onClick={() => setSubmitMode("draft")}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          >
            บันทึกร่าง
          </button>
          <button
            type="submit"
            disabled={pending}
            onClick={() => setSubmitMode("submit")}
            className={cn(buttonVariants(), "min-h-11")}
          >
            {pending ? "กำลังบันทึก…" : "บันทึกเสนอ"}
          </button>
          <Link
            href={cancelHref}
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11")}
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </section>
  );
}
