"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  isGroupActive,
  isHomeActive,
  isModuleActive,
} from "@/components/app-shell/app-menu-list";
import type { AppMenuGroup } from "@/lib/modules/get-app-menu";
import {
  getModuleStatus,
  isNavigable,
} from "@/lib/modules/implementation-status";
import {
  menuGroupIconComponent,
  moduleIconComponent,
} from "@/lib/modules/menu-icons";
import { cn } from "@/lib/utils";

type AppTopNavProps = {
  menu: AppMenuGroup[];
};

export function AppTopNav({ menu }: AppTopNavProps) {
  const pathname = usePathname();

  if (menu.length === 0) {
    return (
      <nav
        className="sticky top-14 z-30 hidden border-b bg-card/95 backdrop-blur lg:block"
        aria-label="เมนูหลัก"
      >
        <div className="flex h-11 items-center px-4 lg:px-6">
          <Link
            href="/home"
            className={cn(
              buttonVariants({
                variant: isHomeActive(pathname) ? "secondary" : "ghost",
                size: "sm",
              }),
              "min-h-9",
            )}
          >
            หน้าแรก
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky top-14 z-30 hidden border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:block"
      aria-label="เมนูหลัก"
    >
      <div className="flex h-11 items-center gap-1 overflow-x-auto px-4 lg:px-6">
        <Link
          href="/home"
          className={cn(
            buttonVariants({
              variant: isHomeActive(pathname) ? "secondary" : "ghost",
              size: "sm",
            }),
            "shrink-0 min-h-9",
          )}
        >
          หน้าแรก
        </Link>

        {menu.map((group) => {
          const GroupIcon = menuGroupIconComponent(group.icon);
          const groupActive = isGroupActive(pathname, group);

          if (group.modules.length === 1 && !group.preferFlyout) {
            const mod = group.modules[0]!;
            const ModIcon = moduleIconComponent(mod.slug);
            const active = isModuleActive(pathname, mod.href);
            const status = getModuleStatus(mod.slug);
            const navigable = isNavigable(status);

            const label = (
              <>
                <GroupIcon className="size-4 shrink-0 opacity-70" aria-hidden />
                {group.name}
                <ModIcon className="size-3.5 shrink-0 opacity-50" aria-hidden />
                {status !== "ready" ? (
                  <ModuleStatusBadge status={status} className="ml-0.5" />
                ) : null}
              </>
            );

            if (!navigable) {
              return (
                <span
                  key={group.id}
                  aria-disabled
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "shrink-0 min-h-9 gap-1.5 cursor-not-allowed text-muted-foreground/60",
                  )}
                >
                  {label}
                </span>
              );
            }

            return (
              <Link
                key={group.id}
                href={mod.href}
                className={cn(
                  buttonVariants({
                    variant: active ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "shrink-0 min-h-9 gap-1.5",
                )}
              >
                {label}
              </Link>
            );
          }

          return (
            <DropdownMenu key={group.id}>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={groupActive ? "secondary" : "ghost"}
                    size="sm"
                    className="shrink-0 min-h-9 gap-1"
                  />
                }
              >
                <GroupIcon className="size-4 shrink-0 opacity-70" aria-hidden />
                {group.name}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                {group.modules.map((mod) => {
                  const ModIcon = moduleIconComponent(mod.slug);
                  const active = isModuleActive(pathname, mod.href);
                  const status = getModuleStatus(mod.slug);
                  const navigable = isNavigable(status);

                  if (!navigable) {
                    return (
                      <DropdownMenuItem
                        key={mod.slug}
                        disabled
                        className="flex items-center gap-2 opacity-60"
                      >
                        <ModIcon
                          className="size-4 shrink-0 opacity-70"
                          aria-hidden
                        />
                        <span className="flex-1">{mod.name}</span>
                        <ModuleStatusBadge status={status} />
                      </DropdownMenuItem>
                    );
                  }

                  return (
                    <DropdownMenuItem
                      key={mod.slug}
                      render={
                        <Link
                          href={mod.href}
                          className={cn(
                            "flex w-full items-center gap-2",
                            active && "font-medium",
                          )}
                        />
                      }
                    >
                      <ModIcon
                        className="size-4 shrink-0 opacity-70"
                        aria-hidden
                      />
                      <span className="flex-1">{mod.name}</span>
                      <ModuleStatusBadge status={status} />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
    </nav>
  );
}
