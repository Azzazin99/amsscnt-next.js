import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<number, string> = {
  1: "ปกติ",
  2: "ด่วน",
  3: "ด่วนมาก",
  4: "ด่วนที่สุด",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-amber-500",
  3: "bg-orange-600",
  4: "bg-destructive",
};

type UrgencyLevelBadgeProps = {
  level?: number;
  className?: string;
};

export function UrgencyLevelBadge({
  level = 1,
  className,
}: UrgencyLevelBadgeProps) {
  const safeLevel = level >= 1 && level <= 4 ? level : 1;

  return (
    <span
      className={cn(
        "ml-1 inline-block h-[11px] w-5 shrink-0 align-middle",
        LEVEL_COLORS[safeLevel],
        className,
      )}
      title={LEVEL_LABELS[safeLevel]}
      aria-label={`ระดับความสำคัญ: ${LEVEL_LABELS[safeLevel]}`}
    />
  );
}
