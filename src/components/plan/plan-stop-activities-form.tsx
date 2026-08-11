"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { updateStoppedActivities } from "@/lib/plan/stop-actions";
import { cn } from "@/lib/utils";

type ActivityRow = {
  id: number;
  codeProj: string;
  codeActi: string;
  nameActi: string;
  budgetActi: number;
  stop: number | null;
  projectName: string | null;
};

export function PlanStopActivitiesForm({
  budgetYear,
  activities,
}: {
  budgetYear: number;
  activities: ActivityRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const stoppedIds = form.getAll("stop").map((v) => Number(v));
    try {
      await updateStoppedActivities(budgetYear, stoppedIds);
      setMessage("บันทึกสถานะการหยุดกิจกรรมแล้ว");
      router.refresh();
    } catch {
      setMessage("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 text-center font-medium">หยุด</th>
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">กิจกรรม</th>
              <th className="px-3 py-3 font-medium">โครงการ</th>
              <th className="px-3 py-3 text-right font-medium">งบ</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่พบกิจกรรม
                </td>
              </tr>
            ) : (
              activities.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      name="stop"
                      value={a.id}
                      defaultChecked={a.stop === 1}
                      className="size-4 rounded border-input"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-mono">{a.codeActi}</td>
                  <td className="px-3 py-2.5">{a.nameActi}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {a.projectName ?? a.codeProj}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(a.budgetActi)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {message ? (
        <p className={cn("text-sm text-primary")} role="alert">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังบันทึก…" : "บันทึกสถานะ"}
      </Button>
    </form>
  );
}
