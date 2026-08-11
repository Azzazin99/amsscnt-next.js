"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import {
  MODULE_MANUAL_STATUS,
  MODULE_MANUAL_STATUS_LABEL,
  STATUS_LABELS,
  getRouteStatus,
  isModuleManualRoute,
  isRouteNavigable,
} from "@/lib/modules/implementation-status";
import { cn } from "@/lib/utils";

export type ModuleNavLinkDef = {
  href?: string;
  label: string;
  visible?: boolean;
  exact?: boolean;
  children?: ModuleNavLinkDef[];
};

export type ModuleNavSectionDef = {
  title?: string;
  links: ModuleNavLinkDef[];
  visible?: boolean;
};

function isLinkActive(
  pathname: string,
  href: string,
  exact: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isFlyoutActive(pathname: string, link: ModuleNavLinkDef): boolean {
  if (link.href && isLinkActive(pathname, link.href, link.exact ?? false)) {
    return true;
  }
  return (link.children ?? []).some(
    (child) => child.href && isLinkActive(pathname, child.href, child.exact ?? false),
  );
}

function NavLinkLabel({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const status = getRouteStatus(href);
  const navigable = isRouteNavigable(href, status);
  const isManual = isModuleManualRoute(href);
  const showSoonSuffix = status === "planned" && !isManual;

  return (
    <>
      <span>{label}</span>
      {showSoonSuffix ? (
        <span className="text-xs font-normal opacity-80">
          ({STATUS_LABELS.planned})
        </span>
      ) : isManual ? (
        <ModuleStatusBadge
          status={status}
          label={status === "planned" ? MODULE_MANUAL_STATUS_LABEL : undefined}
        />
      ) : (
        <ModuleStatusBadge status={status} />
      )}
      {!navigable ? (
        <span className="sr-only"> (ยังไม่พร้อม)</span>
      ) : null}
    </>
  );
}

export function ModuleNavLink({
  href,
  label,
  pathname,
  exact = false,
}: {
  href: string;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const status = getRouteStatus(href);
  const navigable = isRouteNavigable(href, status);
  const active = isLinkActive(pathname, href, exact);

  const className = cn(
    "inline-flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
    active && navigable
      ? "bg-primary text-primary-foreground"
      : navigable
        ? "bg-muted/60 hover:bg-muted"
        : "cursor-not-allowed bg-muted/40 text-muted-foreground/60",
  );

  if (!navigable) {
    return (
      <span role="link" aria-disabled className={className}>
        <NavLinkLabel href={href} label={label} />
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      <NavLinkLabel href={href} label={label} />
    </Link>
  );
}

function ModuleNavFlyout({
  link,
  pathname,
}: {
  link: ModuleNavLinkDef;
  pathname: string;
}) {
  const children = (link.children ?? []).filter((c) => c.visible !== false);
  const active = isFlyoutActive(pathname, link);

  if (children.length === 0) return null;

  return (
    <div className="group relative z-0 hover:z-40 focus-within:z-40">
      <span
        className={cn(
          "inline-flex cursor-default select-none items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60",
        )}
        aria-haspopup="menu"
      >
        <span>{link.label}</span>
        <ChevronDown
          className="size-4 opacity-70 transition-transform group-hover:rotate-180"
          aria-hidden
        />
      </span>

      <div className="absolute left-0 top-full z-20 hidden min-w-[12rem] pt-1 group-hover:block">
        <div className="rounded-lg border bg-card p-1 shadow-md">
          {children.map((child) => {
            if (!child.href) return null;
            const childActive = isLinkActive(pathname, child.href, child.exact ?? false);
            const status = getRouteStatus(child.href);
            const navigable = isRouteNavigable(child.href, status);

            const itemClass = cn(
              "flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
              childActive && navigable
                ? "bg-primary text-primary-foreground"
                : navigable
                  ? "hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground/60",
            );

            if (!navigable) {
              return (
                <span key={child.href} role="link" aria-disabled className={itemClass}>
                  <NavLinkLabel href={child.href} label={child.label} />
                </span>
              );
            }

            return (
              <Link key={child.href} href={child.href} className={itemClass}>
                <NavLinkLabel href={child.href} label={child.label} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ModuleNavSection({
  title,
  links,
  pathname,
}: {
  title?: string;
  links: ModuleNavLinkDef[];
  pathname: string;
}) {
  const visibleLinks = links.filter((link) => link.visible !== false);
  if (visibleLinks.length === 0) return null;

  return (
    <div className="relative z-0 inline-flex flex-wrap items-center gap-2 hover:z-30">
      {title ? (
        <span className="shrink-0 text-xs font-semibold uppercase text-muted-foreground">
          {title}
        </span>
      ) : null}
      {visibleLinks.map((link) =>
        link.children && link.children.length > 0 ? (
          <ModuleNavFlyout key={link.label} link={link} pathname={pathname} />
        ) : link.href ? (
          <ModuleNavLink
            key={link.href}
            href={link.href}
            label={link.label}
            pathname={pathname}
            exact={link.exact}
          />
        ) : null,
      )}
    </div>
  );
}

export function ModuleNav({
  ariaLabel,
  sections,
}: {
  ariaLabel: string;
  sections: ModuleNavSectionDef[];
}) {
  const pathname = usePathname();

  const visibleSections = sections
    .filter((section) => section.visible !== false)
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => link.visible !== false),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <nav
      className="relative isolate z-30 mb-6 flex flex-row flex-wrap items-center gap-x-4 gap-y-2 border-b pb-4"
      aria-label={ariaLabel}
    >
      {visibleSections.map((section) => (
        <ModuleNavSection
          key={section.title ?? section.links[0]?.label ?? "section"}
          title={section.title}
          links={section.links}
          pathname={pathname}
        />
      ))}
    </nav>
  );
}
