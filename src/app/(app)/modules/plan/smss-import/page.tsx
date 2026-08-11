import Link from "next/link";
import { PlanSmssImport } from "@/components/plan/plan-smss-import";
import {
  getActivePlanYear,
  listSmssSchoolOptions,
  listWorkgroupOptions,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanSmssImportPage() {
  await requirePlanAccess();
  const activeYear = await getActivePlanYear();

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const [schools, workgroups] = await Promise.all([
    listSmssSchoolOptions(),
    listWorkgroupOptions(),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          เรียกข้อมูลจาก SMSS ปีงบประมาณ {activeYear.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ดึงโครงการและกิจกรรมจากระบบ SMSS ของโรงเรียนเข้าสู่แผนงานประจำปี
        </p>
      </div>

      <PlanSmssImport
        schools={schools.map((s) => ({
          officeCode: s.officeCode,
          schoolName: s.schoolName,
        }))}
        workgroups={workgroups}
      />
    </section>
  );
}
