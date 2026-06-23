"use client";

import Link from "next/link";
import { LogOut, Menu, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { AppMobileMenu } from "@/components/app-shell/app-mobile-menu";
import { AppTopNav } from "@/components/app-shell/app-top-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPersonName } from "@/lib/auth/format-name";
import type { AppMenuGroup } from "@/lib/modules/get-app-menu";
import type { AmssSessionUser } from "@/types/next-auth";
import { cn } from "@/lib/utils";

type AppShellProps = {
  user: AmssSessionUser;
  menu: AppMenuGroup[];
  showAdmin?: boolean;
  children: React.ReactNode;
};

export function AppShell({ user, menu, showAdmin = false, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = formatPersonName({
    prefix: user.prefix,
    firstName: user.firstName,
    lastName: user.lastName,
    fallback: user.username,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        ข้ามไปเนื้อหาหลัก
      </a>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="เปิดเมนู"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-primary">
              AMSS/SMSS
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.officeName}
            </p>
          </div>

          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user.userSchoolName ? (
              <p className="truncate text-xs text-muted-foreground">
                {user.userSchoolName}
              </p>
            ) : null}
          </div>

          <ThemeSwitcher />

          {showAdmin ? (
            <Link
              href="/admin/district-settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "shrink-0 size-9",
              )}
              title="จัดการระบบ"
              aria-label="จัดการระบบ"
            >
              <Settings className="size-4" aria-hidden />
            </Link>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </header>

      <AppTopNav menu={menu} />

      <AppMobileMenu
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        menu={menu}
      />

      <main id="main-content" className="min-w-0 flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
