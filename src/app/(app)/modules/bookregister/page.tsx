import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageDistrictYears,
  canViewRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";

export default async function BookregisterHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));

  if (canViewRegisters(session.user, perms)) {
    redirect("/modules/bookregister/receive");
  }
  if (canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister/years");
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        คุณไม่มีสิทธิ์ตั้งค่าระบบหรือทะเบียนรับ — ติดต่อผู้ดูแล
      </p>
    </section>
  );
}
