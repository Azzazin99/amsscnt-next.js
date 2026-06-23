import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { BookListFilters } from "@/components/book/book-list-filters";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import { buttonVariants } from "@/components/ui/button";
import { canAccessBookSecretLevel, canWriteBook } from "@/lib/book/permissions";
import { buildBookSentUrl } from "@/lib/book/list-url";
import {
  BOOK_PAGE_SIZE,
  countBookSent,
  listBookSentPage,
  parseBookSentParams,
  resolveBookListPage,
} from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";
import { urgencyLevelLabel } from "@/lib/bookregister/regulation-fields";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; type?: string }>;
};

export default async function BookSentPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireBookScope();
  const params = await searchParams;
  const parsed = parseBookSentParams(params);
  const total = await countBookSent(scope, parsed.q, parsed.type);
  const page = await resolveBookListPage(total, parsed.page);
  const rows = await listBookSentPage({ ...parsed, page, scope, type: parsed.type });
  const totalPages = Math.max(1, Math.ceil(total / BOOK_PAGE_SIZE));
  const canWrite = canWriteBook(user, perms);

  const visibleRows = rows.filter((row) =>
    canAccessBookSecretLevel(user, perms, row.secretLevel),
  );

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted/60 hover:bg-muted",
    );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">หนังสือส่ง</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} ฉบับ
            {parsed.type === "circulation" ? " (หนังสือเวียน)" : ""}
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/book/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            ส่งหนังสือราชการ
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildBookSentUrl({ q: parsed.q, type: "all" })}
          className={tabClass(parsed.type === "all")}
        >
          ทั้งหมด
        </Link>
        <Link
          href={buildBookSentUrl({ q: parsed.q, type: "circulation" })}
          className={tabClass(parsed.type === "circulation")}
        >
          หนังสือเวียน
        </Link>
      </div>

      <BookListFilters
        q={parsed.q}
        ack="all"
        basePath={
          parsed.type === "circulation"
            ? "/modules/book/sent?type=circulation"
            : "/modules/book/sent"
        }
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่ส่ง</th>
              <th className="px-3 py-3 font-medium">เลขที่</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">ผู้รับ</th>
              <th className="px-3 py-3 font-medium">ความเร็ว</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบหนังสือส่ง
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.sendDate.toISOString().slice(0, 10))}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/modules/book/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.bookNo}
                      {row.bookType === 3 ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (เวียน)
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">{row.subject}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.recipientCount.toLocaleString("th-TH")} ราย
                  </td>
                  <td className="px-3 py-2.5">
                    {urgencyLevelLabel(row.urgencyLevel)}
                    <UrgencyLevelBadge level={row.urgencyLevel} className="ml-1" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildBookSentUrl({ ...parsed, page: p, type: parsed.type })
        }
      />
    </section>
  );
}
