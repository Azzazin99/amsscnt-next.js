import Link from "next/link";
import { requirePlanAccess } from "@/lib/plan/scope";

const SECTIONS = [
  {
    title: "ตั้งค่าระบบ",
    links: [
      { href: "/modules/plan/permissions", label: "กำหนดเจ้าหน้าที่" },
      { href: "/modules/plan/years", label: "ปีงบประมาณ" },
      { href: "/modules/plan/strategies", label: "กำหนดยุทธศาสตร์" },
    ],
  },
  {
    title: "โครงการประจำปี",
    links: [
      { href: "/modules/plan/projects", label: "กำหนดโครงการ" },
      { href: "/modules/plan/attachments", label: "แนบเอกสารโครงการ" },
      { href: "/modules/plan/smss-import", label: "เรียกข้อมูลจาก SMSS" },
    ],
  },
  {
    title: "เงินเหลือจ่าย",
    links: [
      { href: "/modules/plan/surplus/projects", label: "กำหนดโครงการเงินเหลือจ่าย" },
      { href: "/modules/plan/surplus/activities/stop", label: "หยุดกิจกรรม/โครงการ" },
      { href: "/modules/plan/surplus/reports/allocation", label: "รายงานการจัดสรรเงิน" },
    ],
  },
  {
    title: "รายงาน",
    links: [
      { href: "/modules/plan/reports/by-workgroup", label: "โครงการจำแนกตามกลุ่ม(งาน)" },
      { href: "/modules/plan/reports/by-strategy", label: "โครงการจำแนกตามกลยุทธ์" },
      { href: "/modules/plan/reports/owner-results", label: "รายงานผลการดำเนินงาน" },
    ],
  },
] as const;

export default async function PlanManualPage() {
  await requirePlanAccess();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">คู่มือการใช้งานระบบวางแผน</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ระบบจัดการโครงการและกิจกรรมประจำปี งบเหลือจ่าย และรายงาน สพป.ชัยนาท
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border bg-card p-4">
            <h3 className="text-base font-semibold">{section.title}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
