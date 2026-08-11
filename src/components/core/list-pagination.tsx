import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ListPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  /** สร้าง URL ต่อหน้า — ใช้กับ admin / โมดูลที่มี build*ListUrl */
  hrefForPage?: (page: number) => string;
  /** คง query อื่น — ใช้คู่กับ basePath (bookregister) */
  baseParams?: Record<string, string | undefined>;
  /** path เต็ม เช่น /modules/bookregister/receive */
  basePath?: string;
};

function buildHrefFromParams(
  page: number,
  baseParams: Record<string, string | undefined>,
  basePath?: string,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(baseParams)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  if (basePath) return qs ? `${basePath}?${qs}` : basePath;
  return qs ? `?${qs}` : "?";
}

function resolveHref(
  page: number,
  props: Pick<
    ListPaginationProps,
    "hrefForPage" | "baseParams" | "basePath"
  >,
): string {
  if (props.hrefForPage) return props.hrefForPage(page);
  return buildHrefFromParams(page, props.baseParams ?? {}, props.basePath);
}

/** เช่น 1 2 … 47 */
function buildPageTokens(page: number, totalPages: number): (number | "gap")[] {
  const tokens: (number | "gap")[] = [];

  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) tokens.push(p);
    return tokens;
  }

  tokens.push(1);

  if (page > 3) {
    tokens.push("gap");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let p = start; p <= end; p++) {
    if (!tokens.includes(p)) {
      tokens.push(p);
    }
  }

  if (page < totalPages - 2) {
    tokens.push("gap");
  }

  if (!tokens.includes(totalPages)) {
    tokens.push(totalPages);
  }

  return tokens;
}

const navBtnClass =
  "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-card/60 px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 shadow-xs";

export function ListPagination({
  page,
  totalPages,
  onPageChange,
  hrefForPage,
  baseParams,
  basePath,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const hrefProps = { hrefForPage, baseParams, basePath };
  const tokens = buildPageTokens(page, totalPages);
  const onFirst = page === 1;
  const onLast = page === totalPages;

  const renderButton = (
    targetPage: number,
    disabled: boolean,
    label: string,
    iconLeft?: React.ReactNode,
    iconRight?: React.ReactNode,
  ) => {
    const content = (
      <>
        {iconLeft}
        <span>{label}</span>
        {iconRight}
      </>
    );

    if (disabled) {
      return (
        <span className={navBtnClass} aria-disabled="true">
          {content}
        </span>
      );
    }

    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => onPageChange(targetPage)}
          className={navBtnClass}
        >
          {content}
        </button>
      );
    }

    return (
      <Link href={resolveHref(targetPage, hrefProps)} className={navBtnClass}>
        {content}
      </Link>
    );
  };

  const renderPageItem = (p: number) => {
    const isActive = p === page;

    if (isActive) {
      return (
        <span
          key={p}
          aria-current="page"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-sky-500 px-3 font-semibold text-white shadow-sm dark:bg-sky-500"
        >
          {p}
        </span>
      );
    }

    if (onPageChange) {
      return (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {p}
        </button>
      );
    }

    return (
      <Link
        key={p}
        href={resolveHref(p, hrefProps)}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {p}
      </Link>
    );
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm"
      aria-label="แบ่งหน้า"
    >
      {/* หน้าแรก */}
      {renderButton(
        1,
        onFirst,
        "หน้าแรก",
        <ChevronsLeft className="size-4 shrink-0" aria-hidden="true" />,
      )}

      {/* ก่อนหน้า */}
      {renderButton(
        page - 1,
        onFirst,
        "ก่อนหน้า",
        <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />,
      )}

      {/* เลขหน้า */}
      <div className="flex items-center gap-1">
        {tokens.map((token, index) =>
          token === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-muted-foreground font-semibold select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            renderPageItem(token)
          ),
        )}
      </div>

      {/* ถัดไป */}
      {renderButton(
        page + 1,
        onLast,
        "ถัดไป",
        undefined,
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />,
      )}

      {/* หน้าสุดท้าย */}
      {renderButton(
        totalPages,
        onLast,
        "หน้าสุดท้าย",
        undefined,
        <ChevronsRight className="size-4 shrink-0" aria-hidden="true" />,
      )}

      {/* สรุปหน้า */}
      <span className="ml-2 text-sm text-muted-foreground select-none">
        หน้า {page} จาก {totalPages}
      </span>
    </nav>
  );
}
