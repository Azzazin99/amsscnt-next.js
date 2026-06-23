import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { MeetingNav } from "@/components/meeting/meeting-nav";
import {
  canBookMeeting,
  canManageMeetingSettings,
  canViewMeetingList,
  getMeetingPermissions,
} from "@/lib/meeting/permissions";

export default async function MeetingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getMeetingPermissions(Number(session.user.id));
  if (!canViewMeetingList(session.user, perms)) {
    redirect("/home");
  }

  const canWrite = canBookMeeting(session.user, perms);
  const showAdmin = canManageMeetingSettings(session.user);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "จองห้องประชุม" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">ระบบจองห้องประชุม</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล meeting — สพป.ชัยนาท · ระดับเขต
        </p>
      </div>

      <MeetingNav canWrite={canWrite} showAdmin={showAdmin} />

      {children}
    </div>
  );
}
