import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { QuestionnaireNav } from "@/components/questionnaire/questionnaire-nav";
import { canViewQuestionnaire } from "@/lib/questionnaire/permissions";

export default async function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewQuestionnaire(session.user))) {
    redirect("/home");
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "แบบสอบถาม" },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">แบบสอบถาม</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล questionnaire — สพป.ชัยนาท
        </p>
      </div>

      <QuestionnaireNav />

      {children}
    </div>
  );
}
