import { Metadata } from "next";
import { SqlConsoleForm } from "@/components/core/sql-console-form";
import { requireSystemAdmin } from "@/lib/core/permissions";

export const metadata: Metadata = {
  title: "จัดการฐานข้อมูล (SQL Console) | ผู้ดูแลระบบ",
};

export default async function SqlConsolePage() {
  await requireSystemAdmin();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">จัดการฐานข้อมูล (SQL Console)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เครื่องมือจัดการฐานข้อมูลและรันคำสั่ง SQL ระดับผู้ดูแลระบบเขตพื้นที่
        </p>
      </div>

      <SqlConsoleForm />
    </section>
  );
}
