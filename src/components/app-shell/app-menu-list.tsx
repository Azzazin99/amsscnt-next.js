"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItemWithStatus } from "@/components/app-shell/nav-item-with-status";
import { cn } from "@/lib/utils";
import type { AppMenuGroup } from "@/lib/modules/get-app-menu";
import { getModuleStatus } from "@/lib/modules/implementation-status";
import {
  menuGroupIconComponent,
  moduleIconComponent,
} from "@/lib/modules/menu-icons";

export function isHomeActive(pathname: string): boolean {
  return pathname === "/home";
}

export function isModuleActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(pathname: string, group: AppMenuGroup): boolean {
  return group.modules.some((mod) => isModuleActive(pathname, mod.href));
}

type AppMenuListProps = {
  menu: AppMenuGroup[];
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
  inactiveLinkClassName?: string;
};

export function AppMenuList({
  menu,
  onNavigate,
  className,
  linkClassName,
  activeLinkClassName = "bg-accent font-medium text-accent-foreground",
  inactiveLinkClassName = "text-foreground hover:bg-muted",
}: AppMenuListProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label="เมนูโมดูล"
    >
      <Link
        href="/home"
        onClick={onNavigate}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          linkClassName,
          isHomeActive(pathname)
            ? activeLinkClassName
            : inactiveLinkClassName,
        )}
      >
        หน้าแรก
      </Link>

      {menu.map((group) => {
        const GroupIcon = menuGroupIconComponent(group.icon);
        const groupActive = isGroupActive(pathname, group);

        return (
          <div key={group.id} className="mt-3 first:mt-0 lg:mt-2">
            <p
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase",
                groupActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <GroupIcon className="size-3.5 shrink-0" aria-hidden />
              {group.name}
            </p>
            <ul className="mt-1 space-y-0.5">
              {group.modules.map((mod) => {
                const ModIcon = moduleIconComponent(mod.slug);
                const active = isModuleActive(pathname, mod.href);
                const status = getModuleStatus(mod.slug);

                return (
                  <li key={mod.slug}>
                    <NavItemWithStatus
                      href={mod.href}
                      label={mod.name}
                      status={status}
                      active={active}
                      onNavigate={onNavigate}
                      className={linkClassName}
                      activeClassName={activeLinkClassName}
                      inactiveClassName={inactiveLinkClassName}
                      icon={
                        <ModIcon
                          className="size-4 shrink-0 opacity-70"
                          aria-hidden
                        />
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
