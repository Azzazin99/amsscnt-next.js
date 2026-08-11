import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { AdminDevNav } from "@/components/core/admin-dev-nav";
import { AdminNav } from "@/components/core/admin-nav";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { isDbBrowserEnabled, isDevToolsNavEnabled } from "@/lib/dev/db-browser";
import { isLegacyDumpExportEnabled } from "@/lib/dev/legacy-dump-export";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSystemAdmin();

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "จัดการระบบ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">จัดการระบบ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตั้งค่าหน่วยงานเขต ผู้ใช้ และโมดูล — สำหรับผู้ดูแลระบบ
        </p>
      </div>

      <AdminNav />
      {isDevToolsNavEnabled() ? (
        <AdminDevNav
          dbBrowserEnabled={isDbBrowserEnabled()}
          legacyExportEnabled={
            isLegacyDumpExportEnabled() && user.isSuperAdmin
          }
        />
      ) : null}

      {children}
    </div>
  );
}
