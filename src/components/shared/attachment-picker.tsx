"use client";

import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format/file-size";
import { cn } from "@/lib/utils";

export type PendingAttachment = {
  id: string;
  file: File;
  description: string;
  error?: string;
};

type Props = {
  value: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  maxTotalBytes: number;
  accept: string;
  validate: (file: File) => string | null;
  label?: string;
  hint?: string;
};

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function defaultDescription(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return fileName;
  return fileName.slice(0, dot);
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function attachmentIcon(fileName: string) {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase()
    : "";

  if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
    return FileImage;
  }
  if (["xls", "xlsx"].includes(ext)) {
    return FileSpreadsheet;
  }
  if (["zip", "rar"].includes(ext)) {
    return FileArchive;
  }
  if (["pdf", "doc", "docx", "ppt", "pptx"].includes(ext)) {
    return FileText;
  }
  return FileType;
}

function applyTotalSizeErrors(
  items: PendingAttachment[],
  maxTotalBytes: number,
  validateType: (file: File) => string | null,
): PendingAttachment[] {
  let used = 0;

  return items.map((item) => {
    const typeError = validateType(item.file);
    if (typeError) {
      return { ...item, error: typeError };
    }

    if (used + item.file.size > maxTotalBytes) {
      return {
        ...item,
        error: `ขนาดรวมเกิน ${formatFileSize(maxTotalBytes)} ต่อจดหมาย`,
      };
    }

    used += item.file.size;
    const { error: _removed, ...rest } = item;
    return rest;
  });
}

function sumValidBytes(items: PendingAttachment[]) {
  return items
    .filter((item) => !item.error)
    .reduce((total, item) => total + item.file.size, 0);
}

export function AttachmentPicker({
  value,
  onChange,
  maxTotalBytes,
  accept,
  validate,
  label = "แนบไฟล์ (ถ้ามี)",
  hint,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [zoneMessage, setZoneMessage] = useState<string | null>(null);

  const usedBytes = sumValidBytes(value);
  const validCount = value.filter((item) => !item.error).length;

  const commit = useCallback(
    (items: PendingAttachment[]) => {
      onChange(applyTotalSizeErrors(items, maxTotalBytes, validate));
    },
    [maxTotalBytes, onChange, validate],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const existingKeys = new Set(value.map((item) => fileKey(item.file)));

      const uniqueIncoming = incoming.filter((file) => {
        const key = fileKey(file);
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      const nextItems: PendingAttachment[] = uniqueIncoming.map((file) => ({
        id: crypto.randomUUID(),
        file,
        description: defaultDescription(file.name),
      }));

      if (nextItems.length > 0) {
        commit([...value, ...nextItems]);
      }

      if (incoming.length > uniqueIncoming.length) {
        setZoneMessage("ข้ามไฟล์ที่ซ้ำกันแล้ว");
      } else {
        setZoneMessage(null);
      }
    },
    [commit, value],
  );

  function remove(id: string) {
    commit(value.filter((item) => item.id !== id));
    setZoneMessage(null);
  }

  function updateDescription(id: string, description: string) {
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, description } : item,
      ),
    );
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selected);
    e.target.value = "";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer.files
      ? Array.from(e.dataTransfer.files)
      : [];
    addFiles(dropped);
  }

  function onZoneKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  const totalLabel = `${formatFileSize(usedBytes)} / ${formatFileSize(maxTotalBytes)}`;

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>

      <p className="text-xs text-muted-foreground">
        {hint ??
          `ไม่จำกัดจำนวนไฟล์ · ขนาดรวมสูงสุด ${formatFileSize(maxTotalBytes)} ต่อจดหมาย`}
      </p>

      <p className="text-xs font-medium text-muted-foreground">
        {validCount} ไฟล์ · {totalLabel}
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="เลือกหรือลากไฟล์มาวางเพื่อแนบ"
        onClick={openPicker}
        onKeyDown={onZoneKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5 ring-3 ring-primary/20"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40",
        )}
      >
        <Upload className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">ลากไฟล์มาวางที่นี่</p>
        <p className="text-xs text-muted-foreground">
          หรือคลิกเพื่อเลือกจากเครื่อง · เลือกได้หลายไฟล์
        </p>
      </div>

      {zoneMessage ? (
        <p className="text-xs text-amber-700" role="status">
          {zoneMessage}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((item, index) => {
            const Icon = attachmentIcon(item.file.name);
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-lg border p-3",
                  item.error ? "border-destructive/50 bg-destructive/5" : "bg-card",
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={`ลบไฟล์ ${item.file.name}`}
                        onClick={() => remove(item.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">
                        คำอธิบายไฟล์ {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.description}
                        maxLength={255}
                        placeholder="คำอธิบายไฟล์"
                        className={inputClass}
                        onChange={(e) =>
                          updateDescription(item.id, e.target.value)
                        }
                      />
                    </label>

                    {item.error ? (
                      <p className="text-xs text-destructive" role="alert">
                        {item.error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
      )}
    </fieldset>
  );
}
