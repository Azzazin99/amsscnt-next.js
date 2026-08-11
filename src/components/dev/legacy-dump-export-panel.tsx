"use client";

type Props = {
  legacyTableCount: number;
  excludedAppTableCount: number;
  pgDumpOk: boolean | string;
  downloadHref: string;
};

export function LegacyDumpExportPanel({
  legacyTableCount,
  excludedAppTableCount,
  pgDumpOk,
  downloadHref,
}: Props) {
  const canDownload = pgDumpOk === true;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">ตาราง legacy (ประมาณ)</dt>
          <dd className="font-medium tabular-nums">
            {legacyTableCount.toLocaleString("th-TH")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ตาราง app ที่ยกเว้น</dt>
          <dd className="font-medium tabular-nums">
            {excludedAppTableCount.toLocaleString("th-TH")}
          </dd>
        </div>
      </dl>

      <div
        className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        role="alert"
      >
        <p className="font-medium">ข้อมูลละเอียดอ่อน</p>
        <p className="mt-1 text-destructive/90">
          ไฟล์มีรหัสผ่าน (MD5) เลขบัตรประชาชน และข้อมูลบุคลากร —
          เก็บและส่งต่ออย่างปลอดภัย ไม่ใช่ backup ทั้งระบบ (ใช้ pg_dump cron สำหรับ
          FullBackup)
        </p>
      </div>

      {typeof pgDumpOk === "string" ? (
        <p className="text-sm text-destructive" role="status">
          ไม่พบ <code className="text-xs">pg_dump</code> บนเซิร์ฟเวอร์: {pgDumpOk}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        ไฟล์ที่ได้เป็นรูปแบบ <code className="text-xs">pg_dump --inserts</code> —
        ใกล้เคียง <code className="text-xs">smart_area_postgres.sql</code> พอให้{" "}
        <code className="text-xs">psql</code> โหลดได้ แต่ไม่เหมือนไฟล์ใน git ทุกบรรทัด
      </p>

      <a
        href={canDownload ? downloadHref : undefined}
        aria-disabled={!canDownload}
        className={
          canDownload
            ? "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            : "inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
        }
        download
      >
        ดาวน์โหลด legacy dump
      </a>
    </div>
  );
}
