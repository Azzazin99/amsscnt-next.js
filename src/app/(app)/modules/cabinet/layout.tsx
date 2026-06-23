import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { CabinetNav } from "@/components/cabinet/cabinet-nav";
import {
  canManageCabinetSettings,
  canUploadCabinet,
  canViewCabinetList,
  getCabinetPermissions,
} from "@/lib/cabinet/permissions";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getCabinetPermissions(Number(session.user.id));
  if (!canViewCabinetList(session.user, perms)) {
    redirect("/home");
  }

  const canUpload = canUploadCabinet(session.user, perms);
  const showAdmin = canManageCabinetSettings(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ตู้เอกสาร" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ตู้เอกสาร / วาระประชุม</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล cabinet — สพป.ชัยนาท
        </p>
      </div>

      <CabinetNav canUpload={canUpload} showAdmin={showAdmin} />

      {children}
    </div>
  );
}
