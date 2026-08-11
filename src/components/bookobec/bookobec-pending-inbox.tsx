"use client";

import { useActionState, useState } from "react";
import { registerBookobecPending } from "@/lib/bookobec/actions";
import { Button } from "@/components/ui/button";
import { formatThaiDateCompact } from "@/lib/format/thai-date";

export type BookobecPendingRow = {
  msId: string;
  bookno: string;
  subject: string;
  signdate: string;
  sendDate: string;
  senderName: string;
  detailUrl: string;
};

type BookobecPendingInboxProps = {
  alertText: string;
  items: BookobecPendingRow[];
};

export function BookobecPendingInbox({
  alertText,
  items,
}: BookobecPendingInboxProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { message?: string } | null, formData: FormData) => {
      const result = await registerBookobecPending(formData);
      return { message: result.message, ok: result.ok };
    },
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((item) => item.msId)),
  );

  function toggle(msId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(msId);
      else next.delete(msId);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            รับหนังสือพร้อมลงทะเบียน
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ไม่มีหนังสือที่ยังไม่ได้รับจาก SmartObec
          </p>
        </div>
        {alertText ? (
          <p className="text-sm text-muted-foreground">{alertText}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          รับหนังสือพร้อมลงทะเบียน
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เลือกหนังสือจาก SmartObec แล้วลงทะเบียนรับ + ส่งเข้าระบบรับส่งหนังสือ
        </p>
        {alertText ? (
          <p className="mt-2 text-sm text-muted-foreground">{alertText}</p>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">เลือก</th>
                <th className="px-3 py-3 font-medium">เลขที่หนังสือ</th>
                <th className="px-3 py-3 font-medium">เรื่อง</th>
                <th className="px-3 py-3 font-medium">ลงวันที่</th>
                <th className="px-3 py-3 font-medium">จาก</th>
                <th className="px-3 py-3 font-medium">วันเวลาที่ส่ง</th>
                <th className="px-3 py-3 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.msId} className="border-b last:border-b-0">
                  <td className="px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      name="msIds"
                      value={item.msId}
                      checked={selected.has(item.msId)}
                      onChange={(e) => toggle(item.msId, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">{item.bookno}</td>
                  <td className="px-3 py-3 align-top">{item.subject}</td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {formatThaiDateCompact(item.signdate)}
                  </td>
                  <td className="px-3 py-3 align-top">{item.senderName}</td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    {item.sendDate}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <a
                      href={item.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      คลิก
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || selected.size === 0}>
            {pending ? "กำลังลงทะเบียน…" : "ลงทะเบียนหนังสือ"}
          </Button>
          <span className="text-sm text-muted-foreground">
            เลือก {selected.size} รายการ
          </span>
        </div>

        {state?.message ? (
          <p
            role="alert"
            className={`text-sm ${state.ok ? "text-green-700" : "text-destructive"}`}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
