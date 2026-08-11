import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { AffairNav } from "@/components/affair/affair-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewAffairList,
  canWriteAffair,
  getAffairPermissions,
} from "@/lib/affair/permissions";

export default async function AffairLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getAffairPermissions(Number(session.user.id));
  if (!canViewAffairList(session.user, perms)) {
    redirect("/home");
  }

  const canWrite = canWriteAffair(session.user, perms);
  const settingsNavMode = getModuleSettingsNavMode(session.user, "affair");

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ภารกิจผู้บริหาร" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ภารกิจผู้บริหาร</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล affair — สพป.ชัยนาท
        </p>
      </div>

      <AffairNav canWrite={canWrite} settingsNavMode={settingsNavMode} />

      {children}
    </div>
  );
}
