import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  canManageDistrictYears,
  canViewRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { resolveBookregisterScope } from "@/lib/bookregister/scope";
import { cn } from "@/lib/utils";

export default async function BookregisterHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  const scope = await resolveBookregisterScope(session.user, perms);

  if (scope?.kind === "school") {
    redirect("/modules/bookregister/receive");
  }

  const canYears = canManageDistrictYears(session.user, perms);
  const canRegisters = canViewRegisters(session.user, perms);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        เลือกเมนูจากแถบด้านบน หรือเริ่มจากตั้งค่าปีทะเบียน
      </p>
      {canYears ? (
        <Link
          href="/modules/bookregister/years"
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          กำหนดปีปฏิทิน
        </Link>
      ) : canRegisters ? (
        <Link
          href="/modules/bookregister/receive"
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          ทะเบียนรับ
        </Link>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          คุณไม่มีสิทธิ์ตั้งค่าระบบหรือทะเบียนรับ — ติดต่อผู้ดูแล
        </p>
      )}
    </section>
  );
}
