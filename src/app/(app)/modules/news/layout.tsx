import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { NewsNav } from "@/components/news/news-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewNewsList,
  canWriteNews,
  getNewsPermissions,
} from "@/lib/news/permissions";

export default async function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getNewsPermissions(Number(session.user.id));
  if (!canViewNewsList(session.user, perms)) {
    redirect("/home");
  }

  const canWrite = canWriteNews(session.user, perms);
  const settingsNavMode = getModuleSettingsNavMode(session.user, "news");

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ข่าว" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ข่าว</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล news — สพป.ชัยนาท
        </p>
      </div>

      <NewsNav canWrite={canWrite} settingsNavMode={settingsNavMode} />

      {children}
    </div>
  );
}
