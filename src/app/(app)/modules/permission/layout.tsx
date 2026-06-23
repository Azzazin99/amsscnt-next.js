import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { PermissionNav } from "@/components/permission/permission-nav";
import {
  canManagePermissionSettings,
  canViewPermissionList,
  canWritePermissionRequest,
  getPermissionModuleFlags,
} from "@/lib/permission/permissions";
import { resolvePermissionScope, scopeLabel } from "@/lib/permission/scope";

export default async function PermissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPermissionModuleFlags(Number(session.user.id));
  if (!canViewPermissionList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolvePermissionScope(session.user, perms);
  const canWrite = canWritePermissionRequest(session.user, perms);
  const showAdmin = canManagePermissionSettings(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ขออนุญาตไปราชการ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ขออนุญาตไปราชการ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล permission — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <PermissionNav canWrite={canWrite} showAdmin={showAdmin} />

      {children}
    </div>
  );
}
