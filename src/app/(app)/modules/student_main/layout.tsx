import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { StudentMainNav } from "@/components/student-main/student-main-nav";
import { getModuleSettingsNavMode } from "@/lib/core/permissions";
import {
  canViewStudentList,
  canWriteStudent,
  getStudentPermissions,
} from "@/lib/student-main/permissions";
import { resolveSchoolIdByCode, resolveStudentScope, scopeLabel } from "@/lib/student-main/scope";

export default async function StudentMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId =
    session.user.organizationType === "school"
      ? await resolveSchoolIdByCode(session.user.userSchoolCode?.trim() ?? "")
      : null;

  const perms = await getStudentPermissions(Number(session.user.id), schoolId);
  if (!canViewStudentList(session.user, perms)) redirect("/home");

  const scope = await resolveStudentScope(session.user, perms);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb items={[{ label: "หน้าแรก", href: "/home" }, { label: "ข้อมูลนักเรียน" }]} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold">ข้อมูลนักเรียน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล student_main — สพป.ชัยนาท
          {scope ? ` · ${scopeLabel(scope)}` : ""}
        </p>
      </div>
      <StudentMainNav
        canWrite={canWriteStudent(session.user, perms)}
        settingsNavMode={getModuleSettingsNavMode(session.user, "student_main")}
      />
      {children}
    </div>
  );
}
