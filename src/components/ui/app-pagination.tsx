"use client";

import { useRouter, useSearchParams } from "next/navigation";

type AppPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
};

function getPageItems(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", current, "...", total];
}

export function AppPagination({
  currentPage,
  totalPages,
}: AppPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const navigateToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    router.push(`?${params.toString()}`);
  };

  const pages = getPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 py-3 text-xs sm:text-sm font-medium text-foreground/90 bg-muted/10 border-b last:border-b-0 last:border-t">
      {/* Buttons and Page Numbers */}
      <div className="flex flex-wrap items-center gap-2">
        {/* First Button */}
        <button
          type="button"
          onClick={() => navigateToPage(1)}
          disabled={currentPage <= 1}
          className="px-3.5 py-1.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer shadow-xs whitespace-nowrap"
        >
          &laquo; หน้าแรก
        </button>

        {/* Prev Button */}
        <button
          type="button"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3.5 py-1.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer shadow-xs whitespace-nowrap"
        >
          &lsaquo; ก่อนหน้า
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-muted-foreground">
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => navigateToPage(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "bg-sky-500 text-white font-bold shadow-sm"
                    : "text-foreground hover:text-primary hover:bg-accent/60"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3.5 py-1.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer shadow-xs whitespace-nowrap"
        >
          ถัดไป &rsaquo;
        </button>

        {/* Last Button */}
        <button
          type="button"
          onClick={() => navigateToPage(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-3.5 py-1.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer shadow-xs whitespace-nowrap"
        >
          หน้าสุดท้าย &raquo;
        </button>
      </div>

      {/* Summary Page Text */}
      <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap font-medium pr-2">
        หน้า <span className="text-foreground font-semibold">{currentPage}</span> จาก{" "}
        <span className="text-foreground font-semibold">{totalPages}</span>
      </div>
    </div>
  );
}
