import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { PersonDistrictPositionsTable } from "@/components/person/person-district-positions-table";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { cn } from "@/lib/utils";

const DISTRICT_POSITIONS_DATA = [
  { code: 1, name: "ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา" },
  { code: 2, name: "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา" },
  { code: 3, name: "ผู้อำนวยการกลุ่ม" },
  { code: 4, name: "ศึกษานิเทศก์" },
  { code: 5, name: "นักจัดการงานทั่วไป" },
  { code: 6, name: "เจ้าพนักงานธุรการ" },
  { code: 7, name: "นักประชาสัมพันธ์" },
  { code: 8, name: "นักวิชาการเงินและบัญชี" },
  { code: 9, name: "เจ้าพนักงานการเงินและบัญชี" },
  { code: 10, name: "นักวิชาการพัสดุ" },
  { code: 11, name: "เจ้าหน้าที่พัสดุ" },
  { code: 12, name: "นักทรัพยากรบุคคล" },
  { code: 13, name: "นิติกร" },
  { code: 14, name: "นักวิเคราะห์นโยบายและแผน" },
  { code: 15, name: "นักวิชาการคอมพิวเตอร์" },
  { code: 16, name: "นักวิชาการศึกษา" },
  { code: 17, name: "นักวิชาการตรวจสอบภายใน" },
  { code: 18, name: "พนักงานธุรการ" },
  { code: 19, name: "พนักงานราชการ" },
  { code: 20, name: "นักจิตวิทยาโรงเรียนประจำเขตพื้นที่การศึกษา" },
  { code: 21, name: "ลูกจ้างชั่วคราว" },
  { code: 22, name: "พนักงานขับรถยนต์" },
  { code: 23, name: "แม่บ้าน" },
  { code: 24, name: "ยาม" },
  { code: 25, name: "พนักงานพัสดุ ส 4" },
  { code: 26, name: "ช่างไม้ชั้น 4" },
  { code: 27, name: "พนักงานธุรการ ส4" },
  { code: 28, name: "พนักงานพิมพ์ดีด" },
  { code: 29, name: "รอง สว.(ป) กก.ตชด 13" },
  { code: 30, name: "ธุรการโรงเรียน" },
];

export default async function PersonDistrictPositionsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ตำแหน่งครูและบุคลากรในสำนักงานเขตพื้นที่การศึกษา
          </h2>
          <p className="text-xs text-muted-foreground">
            รายการตำแหน่งบุคลากรประจำสังกัด สพท. ทั้งหมด ({DISTRICT_POSITIONS_DATA.length} ตำแหน่ง)
          </p>
        </div>
        <Link
          href="/modules/person/settings/district-positions/new"
          className={cn(buttonVariants({ variant: "default" }), "min-h-10")}
        >
          เพิ่มข้อมูล
        </Link>
      </div>

      <PersonDistrictPositionsTable initialData={DISTRICT_POSITIONS_DATA} />
    </section>
  );
}
