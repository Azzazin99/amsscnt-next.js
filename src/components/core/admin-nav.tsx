"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import {
  STATUS_LABELS,
  getRouteStatus,
  isNavigable,
} from "@/lib/modules/implementation-status";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  {
    href: "/admin/district-settings",
    label: "ตั้งค่าหน่วยงานเขต",
  },
  { href: "/admin/schools", label: "สถานศึกษา" },
  { href: "/admin/school-groups", label: "กลุ่มสถานศึกษา" },
  { href: "/admin/workgroups", label: "กลุ่มงาน" },
  { href: "/admin/modules", label: "เปิด/ปิดโมดูล" },
  { href: "/admin/module-admins", label: "ผู้ดูแลโมดูล" },
  { href: "/admin/users", label: "ผู้ใช้งาน" },
  { href: "/admin/permissions", label: "สิทธิ์โมดูล" },
] as const;

function AdminNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const status = getRouteStatus(href);
  const navigable = isNavigable(status);
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const showSoonSuffix = status === "planned";

  const className = cn(
    "inline-flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
    active && navigable
      ? "bg-primary text-primary-foreground"
      : navigable
        ? "bg-muted/60 hover:bg-muted"
        : "cursor-not-allowed bg-muted/40 text-muted-foreground/60",
  );

  const labelContent = (
    <>
      <span>{label}</span>
      {showSoonSuffix ? (
        <span className="text-xs font-normal opacity-80">
          ({STATUS_LABELS.planned})
        </span>
      ) : (
        <ModuleStatusBadge status={status} />
      )}
    </>
  );

  if (!navigable) {
    return (
      <span
        role="link"
        aria-disabled
        className={className}
        onClick={(e) => e.preventDefault()}
      >
        {labelContent}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {labelContent}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b pb-4"
      aria-label="เมนูจัดการระบบ"
    >
      {ADMIN_LINKS.map((link) => (
        <AdminNavLink
          key={link.href}
          href={link.href}
          label={link.label}
          pathname={pathname}
        />
      ))}
    </nav>
  );
}
