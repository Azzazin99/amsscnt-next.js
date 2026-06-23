import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { PlanNav } from "@/components/plan/plan-nav";
import {
  canManagePlanSettings,
  canViewPlan,
  canWritePlan,
} from "@/lib/plan/permissions";

export default async function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canViewPlan(session.user)) redirect("/home");

  const canWrite = canWritePlan(session.user);
  const showAdmin = canManagePlanSettings(session.user);

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
          โมดูล plan — โครงการและกิจกรรมประจำปี สพป.ชัยนาท
        </p>
      </div>

      <PlanNav canWrite={canWrite} showAdmin={showAdmin} />

      {children}
    </div>
  );
}
