import Link from "next/link";
import { redirect } from "next/navigation";
import { RetentionSettingsForm } from "@/components/book/retention-settings-form";
import { updateRetentionSetting } from "@/lib/book/retention/actions";
import {
  listAgedBooksForReview,
  listRetentionSettings,
} from "@/lib/book/retention/queries";
import { canManageBookSettings } from "@/lib/book/permissions";
import { requireBookScope } from "@/lib/book/scope";
import { formatThaiDate } from "@/lib/format/thai-date";

const BOOK_TYPE_LABELS: Record<number, string> = {
  1: "หนังสือราชการ (เขต)",
  2: "หนังสือจากโรงเรียน",
  3: "หนังสือเวียน",
  6: "ส่งต่อจากทะเบียน",
};

export default async function BookRetentionPage() {
  const { user, scope } = await requireBookScope();
  if (scope.kind !== "district" || !canManageBookSettings(user)) {
    redirect("/modules/book/inbox");
  }

  const [settings, agedBooks] = await Promise.all([
    listRetentionSettings(),
    listAgedBooksForReview(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          อายุเก็บ / ทำลายเอกสาร
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ตั้งค่าอายุเก็บตามประเภทหนังสือ (ค่าเริ่มต้น 2 ปี) และตรวจรายการครบกำหนด
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">ตั้งค่าอายุเก็บ (ปี)</h3>
        <div className="space-y-3">
          {settings.map((row) => (
            <RetentionSettingsForm
              key={row.bookType}
              bookType={row.bookType}
              label={BOOK_TYPE_LABELS[row.bookType] ?? `ประเภท ${row.bookType}`}
              retentionYears={row.retentionYears}
              action={updateRetentionSetting}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold">
          รายการครบอายุเก็บ ({agedBooks.length.toLocaleString("th-TH")} ฉบับ)
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          รายการนี้สำหรับตรวจทบทวนก่อนทำลาย — ยังไม่มี workflow อนุมัติทำลายใน MVP
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">ลงวันที่</th>
                <th className="px-3 py-2 font-medium">เลขที่</th>
                <th className="px-3 py-2 font-medium">เรื่อง</th>
                <th className="px-3 py-2 font-medium">ประเภท</th>
                <th className="px-3 py-2 font-medium">อายุเก็บ</th>
              </tr>
            </thead>
            <tbody>
              {agedBooks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    ไม่มีหนังสือครบอายุเก็บ
                  </td>
                </tr>
              ) : (
                agedBooks.slice(0, 100).map((row, index) => (
                  <tr
                    key={row.id}
                    className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatThaiDate(row.signDate)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/modules/book/${row.id}`}
                        className="text-primary hover:underline"
                      >
                        {row.bookNo}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.subject}</td>
                    <td className="px-3 py-2">
                      {BOOK_TYPE_LABELS[row.bookType] ?? row.bookType}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.retentionYears} ปี
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {agedBooks.length > 100 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              แสดง 100 รายการแรกจาก {agedBooks.length.toLocaleString("th-TH")}{" "}
              ฉบับ
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
