"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import {
  fetchSmssPlanPreview,
  importSmssPlanPreview,
  type SmssPlanPreviewItem,
} from "@/lib/plan/smss-import";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type SchoolOption = { officeCode: number; schoolName: string };
type WorkgroupOption = { legacyCode: number; name: string };

export function PlanSmssImport({
  schools,
  workgroups,
}: {
  schools: SchoolOption[];
  workgroups: WorkgroupOption[];
}) {
  const router = useRouter();
  const [officeCode, setOfficeCode] = useState("");
  const [codeClus, setCodeClus] = useState("");
  const [items, setItems] = useState<SmssPlanPreviewItem[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    if (!officeCode) return;
    setLoading(true);
    setMessage(null);
    setItems(null);
    try {
      const result = await fetchSmssPlanPreview(Number(officeCode));
      if (result.ok) {
        setItems(result.items);
        if (result.items.length === 0) {
          setMessage({ ok: false, text: "ไม่พบข้อมูลโครงการจาก SMSS" });
        }
      } else {
        setMessage({ ok: false, text: result.message });
      }
    } catch {
      setMessage({ ok: false, text: "ดึงข้อมูลไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!items || items.length === 0 || !codeClus) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await importSmssPlanPreview(items, Number(codeClus));
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setItems(null);
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "นำเข้าไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="min-w-[220px] flex-1 space-y-1">
          <label htmlFor="officeCode" className="text-xs font-medium">
            โรงเรียน (SMSS)
          </label>
          <select
            id="officeCode"
            value={officeCode}
            onChange={(e) => setOfficeCode(e.target.value)}
            className={inputClass}
          >
            <option value="">— เลือกโรงเรียน —</option>
            {schools.map((s) => (
              <option key={s.officeCode} value={s.officeCode}>
                {s.officeCode} {s.schoolName}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px] space-y-1">
          <label htmlFor="codeClus" className="text-xs font-medium">
            กลุ่มงานปลายทาง
          </label>
          <select
            id="codeClus"
            value={codeClus}
            onChange={(e) => setCodeClus(e.target.value)}
            className={inputClass}
          >
            <option value="">— เลือกกลุ่มงาน —</option>
            {workgroups.map((wg) => (
              <option key={wg.legacyCode} value={wg.legacyCode}>
                {wg.legacyCode} {wg.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          onClick={handlePreview}
          disabled={loading || !officeCode}
          className="min-h-11"
        >
          {loading ? "กำลังดึง…" : "ดึงข้อมูล"}
        </Button>
      </div>

      {message ? (
        <p
          className={cn("text-sm", message.ok ? "text-primary" : "text-destructive")}
          role="alert"
        >
          {message.text}
        </p>
      ) : null}

      {items && items.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-3 font-medium">รหัส</th>
                  <th className="px-3 py-3 font-medium">ชื่อโครงการ</th>
                  <th className="px-3 py-3 text-right font-medium">งบ</th>
                  <th className="px-3 py-3 text-center font-medium">กิจกรรม</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.codeProj} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 font-mono">{item.codeProj}</td>
                    <td className="px-3 py-2.5">{item.nameProj}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(item.budgetProj)}</td>
                    <td className="px-3 py-2.5 text-center">{item.activities.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            onClick={handleImport}
            disabled={loading || !codeClus}
            className="min-h-11"
          >
            {loading ? "กำลังนำเข้า…" : `นำเข้า ${items.length} โครงการ`}
          </Button>
          {!codeClus ? (
            <p className="text-sm text-muted-foreground">เลือกกลุ่มงานปลายทางก่อนนำเข้า</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
