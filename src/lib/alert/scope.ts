import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewAlert } from "@/lib/alert/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireAlertScope(): Promise<{
  user: AmssSessionUser;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewAlert(session.user))) {
    redirect("/home");
  }

  return { user: session.user };
}
