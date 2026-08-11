"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { STANDARD_ATTACHMENT_ACCEPT, STANDARD_ATTACHMENT_TYPES_LABEL } from "@/lib/form/attachment-allowed-types";
import { cn } from "@/lib/utils";

const ATTACHMENT_ACCEPT = STANDARD_ATTACHMENT_ACCEPT;

export type CommandFormDefaults = {
  signdate?: string;
  subject?: string;
  comment?: string;
  bookNo?: string;
  fileName?: string | null;
  commandId?: number;
};

export type CommandFormActionResult =
  | { ok: true; id?: number }
  | { ok: false; message?: string };

type CommandFormProps = {
  title: string;
  cancelHref: string;
  action: (formData: FormData) => Promise<CommandFormActionResult | void>;
  defaultValues?: CommandFormDefaults;
  mode: "create" | "edit";
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CommandForm({
  title,
  cancelHref,
  action,
  defaultValues,
  mode,
}: CommandFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPendingFileName(file?.name ?? null);
    if (file) setRemoveAttachment(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (removeAttachment) {
        formData.set("removeAttachment", "1");
      }
      const result = await action(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (mode === "edit" && result && "ok" in result && result.ok) {
        router.refresh();
      } else if (result && "ok" in result && result.ok) {
        router.push(cancelHref);
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const hasExistingFile =
    Boolean(defaultValues?.fileName) && !removeAttachment;

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="mx-auto max-w-3xl space-y-4"
    >
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      {mode === "create" && defaultValues?.bookNo ? (
        <p className="text-sm text-muted-foreground">
          เลขที่หนังสือ (อัตโนมัติ):{" "}
          <span className="font-medium text-foreground">
            {defaultValues.bookNo}
          </span>
        </p>
      ) : null}

      {mode === "edit" && defaultValues?.bookNo ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">เลขที่หนังสือ</label>
          <p className="text-sm">{defaultValues.bookNo}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="signdate" className="text-sm font-medium">
          สั่ง ณ วันที่ <span className="text-destructive">*</span>
        </label>
        <ThaiDatePicker
          id="signdate"
          name="signdate"
          defaultValue={defaultValues?.signdate}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          เรื่อง <span className="text-destructive">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          required
          defaultValue={defaultValues?.subject}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">
          หมายเหตุ
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          defaultValue={defaultValues?.comment}
          className={cn(inputClass, "h-auto min-h-20 py-2")}
        />
      </div>

      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-medium">ไฟล์แนบ</p>

        {hasExistingFile && defaultValues?.commandId ? (
          <p className="text-sm">
            ไฟล์ปัจจุบัน:{" "}
            <Link
              href={`/api/bookregister/command/${defaultValues.commandId}/file`}
              className="font-medium text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {defaultValues.fileName}
            </Link>
          </p>
        ) : null}

        {hasExistingFile ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeAttachment}
              onChange={(e) => {
                const checked = e.target.checked;
                setRemoveAttachment(checked);
                if (checked) {
                  setPendingFileName(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
            />
            ลบไฟล์แนบเดิม
          </label>
        ) : null}

        {!removeAttachment ? (
          <>
            <input
              ref={fileInputRef}
              id="attachment"
              name="attachment"
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              className="min-h-10"
              onClick={openFilePicker}
            >
              <Paperclip data-icon="inline-start" />
              {hasExistingFile ? "เปลี่ยนไฟล์แนบ" : "แนบไฟล์"}
            </Button>
            {pendingFileName ? (
              <p className="text-sm text-foreground">
                เลือกแล้ว:{" "}
                <span className="font-medium">{pendingFileName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                ยังไม่ได้เลือกไฟล์ (ไม่บังคับ)
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            จะลบไฟล์แนบเดิมเมื่อบันทึก
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          รองรับ {STANDARD_ATTACHMENT_TYPES_LABEL}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
