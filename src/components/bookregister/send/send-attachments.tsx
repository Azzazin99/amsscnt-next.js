"use client";

import { Paperclip } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { STANDARD_ATTACHMENT_ACCEPT, STANDARD_ATTACHMENT_TYPES_LABEL } from "@/lib/form/attachment-allowed-types";
import { cn } from "@/lib/utils";

type SendFileRow = {
  id: number;
  fileName: string;
  fileDes: string | null;
  downloadUrl: string;
};

type Props = {
  sendId: number;
  className?: string;
};

const ACCEPT = STANDARD_ATTACHMENT_ACCEPT;

export function SendAttachments({ sendId, className }: Props) {
  const [files, setFiles] = useState<SendFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileDes, setFileDes] = useState("");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const baseUrl = useMemo(
    () => `/api/bookregister/send/${sendId}/files`,
    [sendId],
  );

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(baseUrl, { cache: "no-store" });
      const data = (await res.json()) as SendFileRow[] | { message?: string };
      if (!res.ok) {
        throw new Error(
          (data as { message?: string })?.message ?? "โหลดรายการไฟล์ไม่สำเร็จ",
        );
      }
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดรายการไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch attachment list on mount / URL change
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  function openFilePicker() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function uploadOne(file: File, description: string) {
    const form = new FormData();
    form.set("file", file);
    if (description) form.set("fileDes", description);

    const res = await fetch(baseUrl, { method: "POST", body: form });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data?.ok) {
      throw new Error(data?.message ?? "แนบไฟล์ไม่สำเร็จ");
    }
  }

  async function uploadFiles(files: File[]) {
    setError(null);
    setUploading(true);

    const description = fileDes.trim();
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        await uploadOne(files[i], description);
      } catch (e) {
        failed.push(
          `${files[i].name}: ${e instanceof Error ? e.message : "แนบไฟล์ไม่สำเร็จ"}`,
        );
      }
    }

    setProgress(null);
    setUploading(false);
    setFileDes("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (failed.length > 0) {
      setError(`แนบไม่สำเร็จ ${failed.length} ไฟล์ — ${failed.join("; ")}`);
    }

    await refresh();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) return;
    await uploadFiles(selected);
  }

  async function handleDelete(fileId: number) {
    setError(null);
    const ok = window.confirm("ยืนยันลบไฟล์แนบ?");
    if (!ok) return;

    try {
      const res = await fetch(`${baseUrl}/${fileId}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "ลบไฟล์ไม่สำเร็จ");
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไฟล์ไม่สำเร็จ");
    }
  }

  return (
    <section className={cn("mt-6 rounded-xl border bg-card p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">ไฟล์แนบ</h3>
        <Button type="button" variant="secondary" onClick={refresh} disabled={loading}>
          รีเฟรช
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileSelected}
      />

      <div className="mt-3 space-y-2">
        <label htmlFor="sendFileDes" className="text-sm font-medium">
          คำอธิบายไฟล์ (ไม่บังคับ)
        </label>
        <input
          id="sendFileDes"
          type="text"
          value={fileDes}
          onChange={(e) => setFileDes(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="เช่น หนังสือฉบับจริง, PDF สแกน, เอกสารแนบ"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          className="min-h-10"
        >
          <Paperclip data-icon="inline-start" />
          {uploading
            ? progress
              ? `กำลังแนบไฟล์... (${progress.current}/${progress.total})`
              : "กำลังแนบไฟล์..."
            : "แนบไฟล์"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        เลือกได้หลายไฟล์พร้อมกัน · รองรับ {STANDARD_ATTACHMENT_TYPES_LABEL} (สูงสุด 20MB/ไฟล์)
      </p>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลดรายการไฟล์...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <a
                    href={f.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    {f.fileDes || f.fileName}
                  </a>
                  <div className="truncate text-xs text-muted-foreground">
                    {f.fileName}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(f.id)}
                >
                  ลบ
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
