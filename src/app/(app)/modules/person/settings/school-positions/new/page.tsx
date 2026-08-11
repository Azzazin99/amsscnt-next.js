import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";

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

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function PersonSchoolPositionNewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <div>
        <h2 className="text-xl font-semibold text-primary">เพิ่มตำแหน่ง</h2>
        <p className="text-sm text-muted-foreground">
          กำหนดตำแหน่งครูและบุคลากรในสถานศึกษา
        </p>
      </div>

      <form className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="positionCode" className="block text-sm font-medium">
            รหัสตำแหน่ง
          </label>
          <input
            id="positionCode"
            name="positionCode"
            type="number"
            placeholder="กรอกรหัส"
            required
            className={`${inputClass} w-36`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="positionName" className="block text-sm font-medium">
            ชื่อตำแหน่ง
          </label>
          <input
            id="positionName"
            name="positionName"
            type="text"
            placeholder="กรอกชื่อตำแหน่ง"
            required
            className={`${inputClass} w-full`}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="button" className="min-h-10">
            ตกลง
          </Button>
          <Link
            href="/modules/person/settings/school-positions"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          คำอธิบายรหัสตำแหน่งมาตรฐาน
        </h3>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          {POSITION_LEGEND_ITEMS.map((item, idx) => (
            <li key={item} className="flex gap-1.5">
              <span className="font-mono text-muted-foreground/70">{idx + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
