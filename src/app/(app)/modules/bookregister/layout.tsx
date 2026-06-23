import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BookregisterNav } from "@/components/bookregister/bookregister-nav";
import {
  canManageDistrictYears,
  canViewRegisters,
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
  const showDistrictSettings = canManageDistrictYears(session.user, perms);
  const showRegisters = canViewRegisters(session.user, perms);
  const scope = await resolveBookregisterScope(session.user, perms);
  const scopeKind = scope?.kind;

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
        showDistrictSettings={showDistrictSettings}
        scopeKind={showRegisters ? scopeKind : undefined}
      />

      {children}
    </div>
  );
}
