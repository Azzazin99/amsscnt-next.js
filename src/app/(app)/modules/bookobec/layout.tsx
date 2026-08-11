import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BookobecNav } from "@/components/bookobec/bookobec-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewBookobec,
  getBookobecPermissions,
} from "@/lib/bookobec/permissions";

export default async function BookobecLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookobecPermissions(Number(session.user.id));
  if (!(await canViewBookobec(session.user, perms))) {
    redirect("/home");
  }

  const settingsNavMode = getModuleSettingsNavMode(session.user, "bookobec");

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "รับส่งหนังสือราชการ สพฐ." },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">รับส่งหนังสือราชการ สพฐ.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล bookobec — สพป.ชัยนาท
        </p>
      </div>

      <BookobecNav settingsNavMode={settingsNavMode} />

      {children}
    </div>
  );
}
