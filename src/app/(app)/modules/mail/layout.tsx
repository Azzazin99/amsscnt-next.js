import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { MailNav } from "@/components/mail/mail-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewMailList,
  canWriteMail,
  getMailPermissions,
} from "@/lib/mail/permissions";

export default async function MailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getMailPermissions(Number(session.user.id));
  if (!canViewMailList(session.user, perms)) {
    redirect("/home");
  }

  const canWrite = canWriteMail(session.user, perms);
  const settingsNavMode = getModuleSettingsNavMode(session.user, "mail");

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "ไปรษณีย์" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ไปรษณีย์</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          หนังสือเวียนภายใน — slug <code className="text-xs">mail</code>
        </p>
      </div>

      <MailNav canWrite={canWrite} settingsNavMode={settingsNavMode} />

      {children}
    </div>
  );
}
