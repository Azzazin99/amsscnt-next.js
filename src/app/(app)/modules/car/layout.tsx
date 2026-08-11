import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { CarNav } from "@/components/car/car-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewCarList,
  canWriteCarRequest,
  getCarPermissions,
} from "@/lib/car/permissions";
import { resolveCarScope, scopeLabel } from "@/lib/car/scope";

export default async function CarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getCarPermissions(Number(session.user.id));
  if (!canViewCarList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolveCarScope(session.user, perms);
  const canWrite = canWriteCarRequest(session.user, perms);
  const settingsNavMode = getModuleSettingsNavMode(session.user, "car");

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ยานพาหนะ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ยานพาหนะ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล car — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <CarNav canWrite={canWrite} settingsNavMode={settingsNavMode} />

      {children}
    </div>
  );
}
