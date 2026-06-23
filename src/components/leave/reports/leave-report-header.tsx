import { formatThaiDate } from "@/lib/format/thai-date";

type LeaveReportHeaderProps = {
  title: string;
  officeName: string;
  subtitle?: string;
};

export function LeaveReportHeader({
  title,
  officeName,
  subtitle,
}: LeaveReportHeaderProps) {
  const todayLabel = formatThaiDate(new Date().toISOString().slice(0, 10));

  return (
    <header className="mb-4 space-y-1 text-center print:mb-6">
      <p className="text-sm text-muted-foreground print:text-black">
        {officeName}
      </p>
      <h2 className="text-lg font-semibold text-primary print:text-black">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm text-muted-foreground print:text-black">
          {subtitle}
        </p>
      ) : null}
      <p className="hidden text-xs text-muted-foreground print:block print:text-black">
        พิมพ์เมื่อ {todayLabel}
      </p>
    </header>
  );
}
