"use client";

import { useState } from "react";

type BookobecIframeProps = {
  title: string;
  src: string;
  height?: number;
};

export function BookobecIframe({
  title,
  src,
  height = 700,
}: BookobecIframeProps) {
  const [blocked, setBlocked] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          เปิดในแท็บใหม่
        </a>
      </div>

      {blocked ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          ไม่สามารถแสดงหน้า สพฐ. ในกรอบนี้ได้ (อาจถูกบล็อกโดย WAF) —
          ใช้ปุ่ม «เปิดในแท็บใหม่»
        </div>
      ) : (
        <iframe
          title={title}
          src={src}
          className="w-full rounded-xl border bg-card"
          style={{ minHeight: height }}
          onError={() => setBlocked(true)}
        />
      )}
    </section>
  );
}
