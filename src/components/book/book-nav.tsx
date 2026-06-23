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

type BookNavProps = {
  showGroups: boolean;
  canWrite: boolean;
  showRetention: boolean;
};

type NavLink = {
  href: string;
  label: string;
  exact: boolean;
};

const BASE_LINKS: NavLink[] = [
  { href: "/modules/book/inbox", label: "หนังสือรับ", exact: true },
  { href: "/modules/book/sent", label: "หนังสือส่ง", exact: false },
  { href: "/modules/book/new", label: "ส่งหนังสือราชการ", exact: false },
  {
    href: "/modules/book/inbox/overdue",
    label: "หนังสือที่ยังไม่รับเกิน 3 วัน",
    exact: false,
  },
  {
    href: "/modules/book/inbox/aged",
    label: "หนังสืออายุเกิน 2 ปี",
    exact: false,
  },
];

const GROUP_LINK: NavLink = {
  href: "/modules/book/groups",
  label: "กลุ่มหนังสือ",
  exact: false,
};

const RETENTION_LINK: NavLink = {
  href: "/modules/book/retention",
  label: "อายุเก็บ / ทำลาย",
  exact: false,
};

function isLinkActive(
  pathname: string,
  href: string,
  exact: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BookNavLink({
  href,
  label,
  pathname,
  exact,
}: {
  href: string;
  label: string;
  pathname: string;
  exact: boolean;
}) {
  const status = getRouteStatus(href);
  const navigable = isNavigable(status);
  const active = isLinkActive(pathname, href, exact);
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
      <span role="link" aria-disabled className={className}>
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

export function BookNav({ showGroups, canWrite, showRetention }: BookNavProps) {
  const pathname = usePathname();

  const links: NavLink[] = [
    BASE_LINKS[0],
    BASE_LINKS[1],
    ...(showGroups ? [GROUP_LINK] : []),
    ...(canWrite ? [BASE_LINKS[2]] : []),
    BASE_LINKS[3],
    BASE_LINKS[4],
    ...(showRetention ? [RETENTION_LINK] : []),
  ];

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b pb-4"
      aria-label="เมนูรับส่งหนังสือ"
    >
      {links.map((link) => (
        <BookNavLink
          key={link.href}
          href={link.href}
          label={link.label}
          pathname={pathname}
          exact={link.exact}
        />
      ))}
    </nav>
  );
}
