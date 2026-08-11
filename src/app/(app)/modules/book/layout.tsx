import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BookNav } from "@/components/book/book-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canManageBookSettings,
  canViewBookList,
  canWriteBook,
  getBookPermissions,
} from "@/lib/book/permissions";
import { resolveBookScope, scopeLabel } from "@/lib/book/scope";

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookPermissions(Number(session.user.id));
  if (!canViewBookList(session.user, perms)) {
    redirect("/home");
  }

  const scope = await resolveBookScope(session.user, perms);
  const canWrite = canWriteBook(session.user, perms);
  const settingsNavMode = getModuleSettingsNavMode(session.user, "book");
  const showRetention =
    scope?.kind === "district" && canManageBookSettings(session.user);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "รับส่งหนังสือราชการ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">รับส่งหนังสือราชการ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล book — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>

      <BookNav
        canWrite={canWrite}
        settingsNavMode={settingsNavMode}
        showRetention={showRetention}
      />

      {children}
    </div>
  );
}
