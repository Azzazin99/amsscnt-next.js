import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { canAccessSystemAdmin } from "@/lib/core/permissions";
import { resolveSessionUser } from "@/lib/core/resolve-session-user";
import { getAppMenu } from "@/lib/modules/get-app-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [menu, user] = await Promise.all([
    getAppMenu(session.user),
    resolveSessionUser(session.user),
  ]);

  return (
    <AppShell
      user={user}
      menu={menu}
      showAdmin={canAccessSystemAdmin(session.user)}
    >
      {children}
    </AppShell>
  );
}
