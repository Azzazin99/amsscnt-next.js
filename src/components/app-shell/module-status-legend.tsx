import { ModuleStatusBadge } from "@/components/app-shell/module-status-badge";
import type { ImplementationStatus } from "@/lib/modules/implementation-status";

const LEGEND_ITEMS: ImplementationStatus[] = [
  "ready",
  "in_progress",
  "planned",
];

export function ModuleStatusLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/80">สถานะเมนู:</span>
      {LEGEND_ITEMS.map((status) => (
        <span key={status} className="inline-flex items-center gap-1">
          <ModuleStatusBadge status={status} />
        </span>
      ))}
      <span className="text-muted-foreground/80">
        (เมนู «เร็วๆ นี้» กดไม่ได้)
      </span>
    </p>
  );
}
