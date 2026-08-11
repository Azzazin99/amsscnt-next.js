import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BookregisterNav } from "@/components/bookregister/bookregister-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewRegisters,
  canViewSchoolBookregisterSettings,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import {
  resolveBookregisterScope,
  scopeLabel,
} from "@/lib/bookregister/scope";

export default async function BookregisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  const settingsNavMode = getModuleSettingsNavMode(session.user, "bookregister");
  const showRegisters = canViewRegisters(session.user, perms);
  const scope = await resolveBookregisterScope(session.user, perms);
  const scopeKind = scope?.kind;
  const canViewSchoolSettings = canViewSchoolBookregisterSettings(
    session.user,
    perms,
  );

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ทะเบียนหนังสือราชการ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ทะเบียนหนังสือราชการ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล bookregister — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <BookregisterNav
        settingsNavMode={settingsNavMode}
        scopeKind={showRegisters ? scopeKind : undefined}
        canViewSchoolSettings={canViewSchoolSettings}
      />

      {children}
    </div>
  );
}
