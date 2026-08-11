"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type DevLink = {
  href: string;
  label: string;
};

type Props = {
  dbBrowserEnabled: boolean;
  legacyExportEnabled: boolean;
};

export function AdminDevNav({ dbBrowserEnabled, legacyExportEnabled }: Props) {
  const pathname = usePathname();
  if (!dbBrowserEnabled && !legacyExportEnabled) return null;

  const links: DevLink[] = [];
  if (dbBrowserEnabled) {
    links.push({ href: "/admin/dev/database", label: "ดูฐานข้อมูล (dev)" });
  }
  if (legacyExportEnabled) {
    links.push({
      href: "/admin/dev/export-legacy",
      label: "ส่งออก legacy dump",
    });
  }

  return (
    <div className="mb-4 border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        เครื่องมือ dev
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
