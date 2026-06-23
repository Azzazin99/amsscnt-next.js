import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewBookobec } from "@/lib/bookobec/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireBookobecScope(): Promise<{
  user: AmssSessionUser;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewBookobec(session.user))) {
    redirect("/home");
  }

  return { user: session.user };
}
