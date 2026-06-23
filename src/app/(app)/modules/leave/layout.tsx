import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { LeaveNav } from "@/components/leave/leave-nav";
import { resolveLeaveApprovalNavItems } from "@/lib/leave/approval-nav";
import {
  canManageLeaveSettings,
  canViewLeaveList,
  getLeavePermissions,
} from "@/lib/leave/permissions";
import { resolveSchoolPrincipalReportViewer } from "@/lib/leave/report-access";
import { resolveLeaveScope, scopeLabel } from "@/lib/leave/scope";

export default async function LaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getLeavePermissions(Number(session.user.id));
  if (!canViewLeaveList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolveLeaveScope(session.user, perms);
  const showAdmin = canManageLeaveSettings(session.user, perms);
  const isPrincipalViewer = scope
    ? await resolveSchoolPrincipalReportViewer(session.user.personId, scope)
    : false;
  const approvalItems = await resolveLeaveApprovalNavItems(
    session.user,
    perms,
    scope,
  );

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ระบบการลา" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ระบบการลา</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล leave — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <LeaveNav
        showAdmin={showAdmin}
        scopeKind={scope?.kind ?? "district"}
        isPrincipalViewer={isPrincipalViewer}
        approvalItems={approvalItems}
      />

      {children}
    </div>
  );
}
