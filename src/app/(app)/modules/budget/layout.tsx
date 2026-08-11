import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BudgetNav } from "@/components/budget/budget-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import { buildBudgetNavContext } from "@/lib/budget/nav-context";
import { canViewBudget, getBudgetPermissions } from "@/lib/budget/permissions";

export default async function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBudgetPermissions(session.user.personId);
  if (!canViewBudget(session.user, perms)) redirect("/home");

  const navCtx = buildBudgetNavContext(
    session.user,
    perms,
    getModuleSettingsNavMode(session.user, "budget"),
  );

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "การเงินและบัญชี" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">การเงินและบัญชี</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล budget — เมนูครบ Amssplus
        </p>
      </div>

      <BudgetNav {...navCtx} />

      {children}
    </div>
  );
}
