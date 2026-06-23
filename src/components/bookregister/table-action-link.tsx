import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const baseClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm transition-colors";

type TableActionLinkProps = {
  href: string;
  "aria-label": string;
  title?: string;
  children: ReactNode;
  variant?: "text" | "icon";
};

export function TableActionLink({
  href,
  "aria-label": ariaLabel,
  title,
  children,
  variant = "text",
}: TableActionLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        baseClass,
        variant === "text" &&
          "text-primary underline-offset-2 hover:bg-muted hover:underline",
        variant === "icon" &&
          "text-muted-foreground hover:bg-muted hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}

export const tableActionButtonClass = cn(
  baseClass,
  "text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50",
);
