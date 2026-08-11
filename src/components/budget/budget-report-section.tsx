import { BudgetReportTable } from "@/components/budget/budget-report-table";
import { AppPagination } from "@/components/ui/app-pagination";
import type { ReportTable } from "@/lib/budget/report-queries";

type Props = {
  title: string;
  description?: string;
  table: ReportTable;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  showTotals?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
};

export function BudgetReportSection({
  title,
  description,
  table,
  emptyMessage,
  headerActions,
  showTotals = true,
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
}: Props) {
  const hasPagination = Boolean(currentPage && totalPages && totalPages > 1);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Compact Integrated Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex items-center gap-2">{headerActions}</div>
        ) : null}
      </div>

      {/* Top Pagination */}
      {hasPagination ? (
        <AppPagination
          currentPage={currentPage!}
          totalPages={totalPages!}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      ) : null}

      {/* Table Content */}
      <BudgetReportTable
        columns={table.columns}
        rows={table.rows}
        emptyMessage={emptyMessage}
        showTotals={showTotals}
      />

      {/* Bottom Pagination */}
      {hasPagination ? (
        <AppPagination
          currentPage={currentPage!}
          totalPages={totalPages!}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      ) : null}
    </section>
  );
}
