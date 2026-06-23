import Link from "next/link";
import { auth } from "@/auth";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import { ModuleStatusLegend } from "@/components/app-shell/module-status-legend";
import { formatPersonName } from "@/lib/auth/format-name";
import { resolveSessionUser } from "@/lib/core/resolve-session-user";
import { getAppMenu } from "@/lib/modules/get-app-menu";
import {
  getModuleStatus,
  isNavigable,
} from "@/lib/modules/implementation-status";
import { moduleIconComponent } from "@/lib/modules/menu-icons";
import { isFirstTimeLogin } from "@/lib/modules/menu-access";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await resolveSessionUser(session.user);
  const menu = await getAppMenu(user);
  const firstTime = isFirstTimeLogin(user.loginStatus);

  return (
    <div className="px-4 py-6 lg:px-8">
      <AppBreadcrumb items={[{ label: "หน้าแรก" }]} />

      {firstTime ? (
        <div
          className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          การ Login ด้วยเลขประจำตัวประชาชน จะได้รับสิทธิ์เพื่อการลงทะเบียนเท่านั้น
          ให้ไปที่เมนูผู้ใช้ (User) แล้วลงทะเบียน หลังจากนั้นออกจากระบบ แล้ว Login
          ด้วย Username และ Password ใหม่อีกครั้ง
        </div>
      ) : null}

      <section className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          สวัสดี, {formatPersonName({ ...user, fallback: user.username })}
          {firstTime ? (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              (สิทธิ์เบื้องต้น)
            </span>
          ) : null}
        </h1>
        <p className="mt-2 text-muted-foreground">{user.officeName}</p>
        {user.userSchoolName ? (
          <p className="mt-1 text-sm text-primary">{user.userSchoolName}</p>
        ) : null}
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          เลือกโมดูลจากเมนูด้านบน หรือจากการ์ดด้านล่าง
        </p>
        {menu.length > 0 ? (
          <div className="mt-3">
            <ModuleStatusLegend />
          </div>
        ) : null}
      </section>

      {menu.length === 0 ? (
        <section className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          {firstTime ? (
            <>
              <p>ยังไม่มีโมดูลให้ใช้งาน — กรุณาลงทะเบียนผู้ใช้ก่อน</p>
              <p className="mt-2">(เมนูลงทะเบียน — P012 ถัดไป)</p>
            </>
          ) : (
            <p>ไม่พบโมดูลที่คุณมีสิทธิ์ใช้งาน</p>
          )}
        </section>
      ) : (
        menu.map((group) => (
          <section key={group.id} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-primary">
              {group.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.modules.map((mod) => {
                const Icon = moduleIconComponent(mod.slug);
                const status = getModuleStatus(mod.slug);
                const navigable = isNavigable(status);

                const cardClass = cn(
                  "group relative flex min-h-[88px] items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors",
                  navigable
                    ? "hover:border-primary/40 hover:bg-accent/30"
                    : "cursor-not-allowed opacity-60",
                );

                const inner = (
                  <>
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                        navigable && "group-hover:bg-primary/15",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 self-center">
                      <span className="block font-medium leading-snug">
                        {mod.name}
                      </span>
                      <ModuleStatusBadge status={status} className="w-fit" />
                    </span>
                  </>
                );

                return navigable ? (
                  <Link key={mod.slug} href={mod.href} className={cardClass}>
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={mod.slug}
                    className={cardClass}
                    aria-disabled
                    role="link"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
