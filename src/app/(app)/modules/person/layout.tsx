import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { PersonNav } from "@/components/person/person-nav";
import {
  canManagePersonPermissions,
  canViewPersonList,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { resolvePersonScope, scopeLabel } from "@/lib/person/scope";

export default async function PersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canViewPersonList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolvePersonScope(session.user, perms);
  const showPermissions = canManagePersonPermissions(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ระบบบริหารงานบุคลากร" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ระบบบริหารงานบุคลากร</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล person — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <PersonNav showPermissions={showPermissions} />

      {children}
    </div>
  );
}
