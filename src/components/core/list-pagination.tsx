import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export type ListPaginationProps = {
  page: number;
  totalPages: number;
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

/** เช่น 1 … 4 5 [6] 7 8 … 199 */
function buildPageTokens(page: number, totalPages: number): (number | "gap")[] {
  const tokens: (number | "gap")[] = [];
  const add = (p: number) => tokens.push(p);

  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);

  add(1);
  if (windowStart > 2) tokens.push("gap");
  for (let p = windowStart; p <= windowEnd; p++) add(p);
  if (windowEnd < totalPages - 1) tokens.push("gap");
  if (totalPages > 1) add(totalPages);

  return tokens;
}

const navButton =
  "inline-flex h-11 min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

const navButtonCompact =
  "inline-flex h-11 min-h-11 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 sm:px-3";

export function ListPagination({
  page,
  totalPages,
  hrefForPage,
  baseParams,
  basePath,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const hrefProps = { hrefForPage, baseParams, basePath };
  const tokens = buildPageTokens(page, totalPages);
  const onFirst = page === 1;
  const onLast = page === totalPages;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 py-3 text-sm"
      aria-label="แบ่งหน้า"
    >
      {onFirst ? (
        <span className={navButtonCompact} aria-disabled>
          <ChevronsLeft className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">หน้าแรก</span>
        </span>
      ) : (
        <Link
          href={resolveHref(1, hrefProps)}
          className={navButtonCompact}
          aria-label="หน้าแรก"
        >
          <ChevronsLeft className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">หน้าแรก</span>
        </Link>
      )}

      {page > 1 ? (
        <Link
          href={resolveHref(page - 1, hrefProps)}
          className={navButton}
          rel="prev"
        >
          <ChevronLeft className="size-4" aria-hidden />
          ก่อนหน้า
        </Link>
      ) : (
        <span className={navButton} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden />
          ก่อนหน้า
        </span>
      )}

      <div className="flex items-center gap-1">
        {tokens.map((token, index) =>
          token === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : token === page ? (
            <span
              key={token}
              aria-current="page"
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg bg-primary px-3 font-semibold text-primary-foreground"
            >
              {token}
            </span>
          ) : (
            <Link
              key={token}
              href={resolveHref(token, hrefProps)}
              aria-label={`หน้า ${token}`}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-3 text-foreground transition-colors hover:bg-muted"
            >
              {token}
            </Link>
          ),
        )}
      </div>

      {page < totalPages ? (
        <Link
          href={resolveHref(page + 1, hrefProps)}
          className={navButton}
          rel="next"
        >
          ถัดไป
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={navButton} aria-disabled>
          ถัดไป
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}

      {onLast ? (
        <span className={navButtonCompact} aria-disabled>
          <span className="hidden sm:inline">หน้าสุดท้าย</span>
          <ChevronsRight className="size-4 shrink-0" aria-hidden />
        </span>
      ) : (
        <Link
          href={resolveHref(totalPages, hrefProps)}
          className={navButtonCompact}
          aria-label="หน้าสุดท้าย"
        >
          <span className="hidden sm:inline">หน้าสุดท้าย</span>
          <ChevronsRight className="size-4 shrink-0" aria-hidden />
        </Link>
      )}

      <span className="w-full text-center text-muted-foreground sm:ml-2 sm:w-auto sm:text-left">
        หน้า {page} จาก {totalPages}
      </span>
    </nav>
  );
}
