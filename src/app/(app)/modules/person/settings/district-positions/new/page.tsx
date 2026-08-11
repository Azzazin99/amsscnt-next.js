import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function PersonDistrictPositionNewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      <div>
        <h2 className="text-xl font-semibold text-primary">เพิ่มตำแหน่ง</h2>
        <p className="text-sm text-muted-foreground">
          กำหนดตำแหน่งครูและบุคลากรในสำนักงานเขตพื้นที่การศึกษา
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
            href="/modules/person/settings/district-positions"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>
    </div>
  );
}
