import { IdocumentNav } from "@/components/idocument/idocument-nav";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { requireIdocumentScope } from "@/lib/idocument/scope";

export default async function IdocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { canWrite, canViewInbox } = await requireIdocumentScope();

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "บันทึกข้อความ" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">บันทึกข้อความ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล idocument — สพป.ชัยนาท
        </p>
      </div>

      <IdocumentNav canWrite={canWrite} canViewInbox={canViewInbox} />

      {children}
    </div>
  );
}
