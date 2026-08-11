import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { PersonDistrictPositionsTable } from "@/components/person/person-district-positions-table";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { cn } from "@/lib/utils";

const SCHOOL_POSITIONS_DATA = [
  { code: 1, name: "ผู้อำนวยการโรงเรียน" },
  { code: 2, name: "รองผู้อำนวยการโรงเรียน" },
  { code: 3, name: "ครู" },
  { code: 4, name: "ครูผู้ช่วย" },
  { code: 5, name: "เจ้าหน้าที่งานสารบรรณโรงเรียน" },
  { code: 11, name: "พนักงานราชการ" },
  { code: 32, name: "เจ้าหน้าที่ธุรการโรงเรียน" },
  { code: 33, name: "ลูกจ้าง" },
  { code: 34, name: "ครูพี่เลี้ยงฯ" },
];

const POSITION_LEGEND_ITEMS = [
  "รหัสผู้อำนวยการโรงเรียนให้เป็น 1",
  "รหัสรองผู้อำนวยการโรงเรียนให้เป็น 2",
  "รหัสครูให้เป็น 3",
  "รหัสครูผู้ช่วยให้เป็น 4",
  "รหัสพนักงานราชการ(ครูผู้สอน)ให้เป็น 11",
  "รหัสพนักงานราชการ(ครูพี่เลี้ยง)ให้เป็น 12",
  "รหัสพนักงานราชการ(อื่น ๆ)ให้เป็น 13",
  "รหัสลูกจ้างประจำ(พนักงานธุรการ)ให้เป็น 21",
  "รหัสลูกจ้างประจำ(พนักงานขับรถยนต์)ให้เป็น 22",
  "รหัสลูกจ้างประจำ(ช่างครุภัณฑ์)ให้เป็น 23",
  "รหัสลูกจ้างประจำ(อื่น ๆ)ให้เป็น 24",
  "รหัสลูกจ้างชั่วคราว(ครู)ให้เป็น 31",
  "รหัสลูกจ้างชั่วคราว(เจ้าหน้าที่ธุรการโรงเรียน)ให้เป็น 32",
  "รหัสลูกจ้างชั่วคราว(นักการภารโรง)ให้เป็น 33",
  "รหัสลูกจ้างชั่วคราว(อื่น ๆ)ให้เป็น 34",
  "รหัสลูกจ้างชั่วคราว(ครูผู้ทรงคุณค่า)ให้เป็น 35",
  "รหัสผู้จัดการโรงเรียนเอกชนให้เป็น 41",
  "รหัสเจ้าหน้าที่บริหารทั่วไปโรงเรียนเอกชนให้เป็น 42",
  "รหัสเจ้าหน้าที่อื่น ๆ โรงเรียนเอกชนให้เป็น 43",
];

export default async function PersonSchoolPositionsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ตำแหน่งครูและบุคลากรในสถานศึกษา
          </h2>
          <p className="text-xs text-muted-foreground">
            รายการตำแหน่งบุคลากรประจำสถานศึกษา/โรงเรียน ({SCHOOL_POSITIONS_DATA.length} ตำแหน่ง)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/modules/person/settings/school-positions/new"
            className={cn(buttonVariants({ variant: "default" }), "min-h-10")}
          >
            เพิ่มข้อมูล
          </Link>
          <Link
            href="/modules/person/settings/school-positions/update-code"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
          >
            ปรับปรุงรหัสตำแหน่ง
          </Link>
        </div>
      </div>

      <PersonDistrictPositionsTable initialData={SCHOOL_POSITIONS_DATA} />

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          คำอธิบายรหัสตำแหน่งมาตรฐาน
        </h3>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          {POSITION_LEGEND_ITEMS.map((item, idx) => (
            <li key={item} className="flex gap-1.5">
              <span className="font-mono text-muted-foreground/70">{idx + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
