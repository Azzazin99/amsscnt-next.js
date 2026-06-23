"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  enabled: boolean;
};

export function AdminDevNav({ enabled }: Props) {
  const pathname = usePathname();
  if (!enabled) return null;

  const href = "/admin/dev/database";
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mb-4 border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        เครื่องมือ dev
      </p>
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground hover:bg-muted/80",
        )}
      >
        ดูฐานข้อมูล (dev)
      </Link>
    </div>
  );
}
