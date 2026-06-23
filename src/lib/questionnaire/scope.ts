import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewQuestionnaire } from "@/lib/questionnaire/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireQuestionnaireScope(): Promise<{
  user: AmssSessionUser;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewQuestionnaire(session.user))) {
    redirect("/home");
  }

  return { user: session.user };
}
