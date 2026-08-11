import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { SpacialStudentNav } from "@/components/spacial-student/spacial-student-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import { resolveSchoolIdByCode } from "@/lib/student-main/scope";
import {
  canViewSpacialStudentList,
  canWriteSpacialStudent,
  getSpacialStudentPermissions,
} from "@/lib/spacial-student/permissions";
import { resolveSpacialStudentScope, scopeLabel } from "@/lib/spacial-student/scope";

export default async function SpacialStudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId =
    session.user.organizationType === "school"
      ? await resolveSchoolIdByCode(session.user.userSchoolCode?.trim() ?? "")
      : null;

  const perms = await getSpacialStudentPermissions(Number(session.user.id), schoolId);
  if (!canViewSpacialStudentList(session.user, perms)) redirect("/home");

  const scope = await resolveSpacialStudentScope(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb items={[{ label: "หน้าแรก", href: "/home" }, { label: "นักเรียนพิเศษ" }]} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold">นักเรียนพิเศษ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล spacial_student — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>
      <SpacialStudentNav
        canWrite={canWriteSpacialStudent(session.user, perms)}
        settingsNavMode={getModuleSettingsNavMode(session.user, "spacial_student")}
      />
      {children}
    </div>
  );
}
