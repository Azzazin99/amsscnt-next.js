import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { AchievementNav } from "@/components/achievement/achievement-nav";
import {
  canManageAchievementSettings,
  canViewAchievementList,
  canWriteAchievementScore,
  getAchievementPermissions,
} from "@/lib/achievement/permissions";
import { resolveAchievementScope, scopeLabel } from "@/lib/achievement/scope";

export default async function AchievementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getAchievementPermissions(Number(session.user.id));
  if (!canViewAchievementList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolveAchievementScope(session.user, perms);
  const canWrite = canWriteAchievementScore(session.user, perms);
  const showAdmin = canManageAchievementSettings(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ผลสัมฤทธิ์ทางการเรียน" },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-xl font-semibold">ผลสัมฤทธิ์ทางการเรียน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล achievement — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>
      <AchievementNav canWrite={canWrite} showAdmin={showAdmin} />
      {children}
    </div>
  );
}
