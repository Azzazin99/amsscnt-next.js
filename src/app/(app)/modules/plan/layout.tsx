import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { PlanNav } from "@/components/plan/plan-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import { buildPlanNavContext } from "@/lib/plan/nav-context";
import { canViewPlan, getPlanPermissions } from "@/lib/plan/permissions";

export default async function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPlanPermissions(session.user.personId);
  if (!canViewPlan(session.user, perms)) redirect("/home");

  const settingsNavMode = getModuleSettingsNavMode(session.user, "plan");
  const navCtx = buildPlanNavContext(session.user, perms, settingsNavMode);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "การวางแผน" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">การวางแผน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โครงการและกิจกรรมประจำปี สพป.ชัยนาท
        </p>
      </div>

      <PlanNav {...navCtx} />

      {children}
    </div>
  );
}
