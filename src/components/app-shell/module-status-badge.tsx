import {
  STATUS_LABELS,
  type ImplementationStatus,
} from "@/lib/modules/implementation-status";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<ImplementationStatus, string> = {
  ready:
    "border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
  in_progress:
    "border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
  planned:
    "border-border/60 bg-muted/40 text-muted-foreground",
};

type ModuleStatusBadgeProps = {
  status: ImplementationStatus;
  /** แทนที่ข้อความป้าย (เช่น คู่มือโมดูล) */
  label?: string;
  className?: string;
};

export function ModuleStatusBadge({
  status,
  label,
  className,
}: ModuleStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        BADGE_STYLES[status],
        className,
      )}
    >
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
