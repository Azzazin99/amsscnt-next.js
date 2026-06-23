import {
  BOOKREGISTER_LIST_PAGE_SIZE,
  BOOKREGISTER_LIST_REGION_MIN_HEIGHT,
} from "@/lib/bookregister/list-constants";
import { cn } from "@/lib/utils";

const rowClass =
  "h-10 animate-pulse rounded-md bg-muted/50 motion-reduce:animate-none";

export function BookregisterListTableSkeleton() {
  return (
    <div
      className="space-y-2"
      style={{ minHeight: BOOKREGISTER_LIST_REGION_MIN_HEIGHT }}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลดรายการ"
    >
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
        <div className="h-4 w-48 max-w-full animate-pulse rounded bg-muted/50 motion-reduce:animate-none sm:mr-auto" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="space-y-2 p-3">
          {Array.from({ length: BOOKREGISTER_LIST_PAGE_SIZE }, (_, i) => (
            <div
              key={i}
              className={cn(rowClass, i % 2 === 1 && "bg-muted/35")}
            />
          ))}
        </div>
      </div>

      <nav
        className="flex flex-wrap items-center justify-center gap-1.5 py-3"
        aria-hidden
      >
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="size-9 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none"
            />
          ))}
        </div>
        <div className="h-9 w-20 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
      </nav>

      <div className="h-4 w-56 max-w-full animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
    </div>
  );
}
