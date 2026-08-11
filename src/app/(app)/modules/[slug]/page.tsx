import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { getAccessibleModules } from "@/lib/modules/get-app-menu";
import {
  STATUS_LABELS,
  getModuleStatus,
} from "@/lib/modules/implementation-status";
import { moduleIconComponent } from "@/lib/modules/menu-icons";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePlaceholderPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  if (slug === "bookregister") {
    redirect("/modules/bookregister");
  }

  if (slug === "person") {
    redirect("/modules/person");
  }

  if (slug === "la" || slug === "leave") {
    redirect("/modules/leave");
  }

  if (slug === "permission") {
    redirect("/modules/permission");
  }

  if (slug === "mail") {
    redirect("/modules/mail/inbox");
  }

  if (slug === "book") {
    redirect("/modules/book");
  }

  if (slug === "bookobec") {
    redirect("/modules/bookobec");
  }

  if (slug === "meeting") {
    redirect("/modules/meeting");
  }

  if (slug === "car") {
    redirect("/modules/car");
  }

  if (slug === "affair") {
    redirect("/modules/affair");
  }

  if (slug === "idocument") {
    redirect("/modules/idocument");
  }

  if (slug === "questionnaire") {
    redirect("/modules/questionnaire");
  }

  if (slug === "alert") {
    redirect("/modules/alert");
  }

  if (slug === "cabinet") {
    redirect("/modules/cabinet");
  }

  if (slug === "news") {
    redirect("/modules/news");
  }

  if (slug === "plan") {
    redirect("/modules/plan");
  }

  if (slug === "budget") {
    redirect("/modules/budget");
  }

  if (slug === "achievement") {
    redirect("/modules/achievement");
  }

  if (slug === "student_main") {
    redirect("/modules/student_main");
  }

  if (slug === "spacial_student") {
    redirect("/modules/spacial_student");
  }

  const accessible = await getAccessibleModules(session.user);
  const mod = accessible.find((m) => m.slug === slug);
  if (!mod) notFound();

  const Icon = moduleIconComponent(slug);
  const status = getModuleStatus(slug);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb
        items={[
          { label: "หน้าแรก", href: "/home" },
          { label: mod.name },
        ]}
      />

      <div className="mx-auto max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {/* eslint-disable-next-line react-hooks/static-components -- Icon from stable MODULE_ICONS map lookup */}
          <Icon className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold">{mod.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          โมดูล <code className="rounded bg-muted px-1">{slug}</code> —{" "}
          {STATUS_LABELS[status]}
          {status === "planned"
            ? " ยังไม่เปิดใช้งานในระบบใหม่"
            : " กำลังพัฒนาตามแผนหน้า P###"}
        </p>
        <Link
          href="/home"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
