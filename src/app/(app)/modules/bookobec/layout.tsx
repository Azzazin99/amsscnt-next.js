import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { BookobecNav } from "@/components/bookobec/bookobec-nav";
import { canViewBookobec } from "@/lib/bookobec/permissions";

export default async function BookobecLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewBookobec(session.user))) {
    redirect("/home");
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: "รับส่งหนังสือราชการ สพฐ." },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-semibold">รับส่งหนังสือราชการ สพฐ.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          โมดูล bookobec — สพป.ชัยนาท
        </p>
      </div>

      <BookobecNav />

      {children}
    </div>
  );
}
