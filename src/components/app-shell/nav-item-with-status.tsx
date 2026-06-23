"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import {
  isNavigable,
  type ImplementationStatus,
} from "@/lib/modules/implementation-status";
import { cn } from "@/lib/utils";

type NavItemWithStatusProps = {
  href: string;
  label: string;
  status: ImplementationStatus;
  active?: boolean;
  onNavigate?: () => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  showBadge?: boolean;
  icon?: ReactNode;
};

export function NavItemWithStatus({
  href,
  label,
  status,
  active = false,
  onNavigate,
  className,
  activeClassName = "bg-accent font-medium text-accent-foreground",
  inactiveClassName = "text-foreground hover:bg-muted",
  showBadge = true,
  icon,
}: NavItemWithStatusProps) {
  const navigable = isNavigable(status);
  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1 line-clamp-2">{label}</span>
      {showBadge ? <ModuleStatusBadge status={status} /> : null}
    </>
  );

  const baseClass = cn(
    "flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    className,
    active ? activeClassName : inactiveClassName,
    !navigable && "cursor-not-allowed text-muted-foreground/60 hover:bg-transparent",
  );

  if (!navigable) {
    return (
      <span
        role="link"
        aria-disabled
        className={baseClass}
        onClick={(e) => e.preventDefault()}
      >
        {content}
      </span>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={baseClass}>
      {content}
    </Link>
  );
}
