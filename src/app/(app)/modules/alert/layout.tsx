import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { AlertNav } from "@/components/alert/alert-nav";
import { canViewAlert } from "@/lib/alert/permissions";

export default async function AlertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewAlert(session.user))) {
    redirect("/home");
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "แจ้งเตือน" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">แจ้งเตือน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล alert — สพป.ชัยนาท
        </p>
      </div>

      <AlertNav />

      {children}
    </div>
  );
}
