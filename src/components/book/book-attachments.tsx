"use client";

import { Paperclip } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { STANDARD_ATTACHMENT_ACCEPT } from "@/lib/form/attachment-allowed-types";
import { cn } from "@/lib/utils";

type BookFileRow = {
  id: number;
  fileName: string;
  fileDes: string | null;
  downloadUrl: string;
};

type Props = {
  documentId: number;
  canUpload: boolean;
  className?: string;
};

const ACCEPT = STANDARD_ATTACHMENT_ACCEPT;

export function BookAttachments({ documentId, canUpload, className }: Props) {
  const [files, setFiles] = useState<BookFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileDes, setFileDes] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const baseUrl = useMemo(
    () => `/api/book/${documentId}/files`,
    [documentId],
  );

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(baseUrl, { cache: "no-store" });
      const data = (await res.json()) as BookFileRow[] | { message?: string };
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

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) return;

    setError(null);
    setUploading(true);
    const description = fileDes.trim();

    try {
      for (const file of selected) {
        await uploadOne(file, description);
      }
      setFileDes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "แนบไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={cn("mt-6 rounded-xl border bg-card p-4", className)}>
      <h3 className="text-sm font-semibold text-primary">ไฟล์แนบ</h3>

      {canUpload ? (
        <>
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
            <label htmlFor="book-fileDes" className="text-sm font-medium">
              คำอธิบายไฟล์
            </label>
            <input
              id="book-fileDes"
              type="text"
              value={fileDes}
              onChange={(e) => setFileDes(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              placeholder="เช่น หนังสือนำ, PDF สแกน"
            />
          </div>
          <div className="mt-3">
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip data-icon="inline-start" />
              {uploading ? "กำลังแนบ..." : "แนบไฟล์ PDF/เอกสาร"}
            </Button>
          </div>
        </>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="rounded-lg border px-3 py-2">
                <a
                  href={f.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {f.fileDes || f.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
