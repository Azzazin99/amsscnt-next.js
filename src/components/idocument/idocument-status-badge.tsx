import { cn } from "@/lib/utils";
import {
  idocumentBookStatusMeta,
  idocumentBookTypeLabel,
  idocumentBookTypeTone,
  type IdocumentStatusTone,
} from "@/lib/idocument/status";

const toneClasses: Record<IdocumentStatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  danger: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
};

type IdocumentStatusBadgeProps = {
  bookStatus: number;
  preDocId?: string;
  className?: string;
};

export function IdocumentStatusBadge({
  bookStatus,
  preDocId,
  className,
}: IdocumentStatusBadgeProps) {
  const meta = idocumentBookStatusMeta(bookStatus, preDocId);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

type IdocumentTypeBadgeProps = {
  bookType: number;
  className?: string;
};

export function IdocumentTypeBadge({ bookType, className }: IdocumentTypeBadgeProps) {
  const tone = idocumentBookTypeTone(bookType);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {idocumentBookTypeLabel(bookType)}
    </span>
  );
}
