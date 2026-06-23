import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { BookListFilters } from "@/components/book/book-list-filters";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import type { BookListRow } from "@/lib/book/queries";
import {
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";
import { formatThaiDate } from "@/lib/format/thai-date";

type InboxBasePath =
  | "/modules/book/inbox"
  | "/modules/book/inbox/overdue"
  | "/modules/book/inbox/aged";

type Props = {
  title: string;
  subtitle?: string;
  total: number;
  rows: BookListRow[];
  page: number;
  totalPages: number;
  q: string;
  ack: string;
  basePath: InboxBasePath;
  showAckFilter: boolean;
  emptyMessage: string;
  hrefForPage: (page: number) => string;
};

export function BookInboxSection({
  title,
  subtitle,
  total,
  rows,
  page,
  totalPages,
  q,
  ack,
  basePath,
  showAckFilter,
  emptyMessage,
  hrefForPage,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} ฉบับ
          {subtitle ? ` · ${subtitle}` : ""}
        </p>
      </div>

      <BookListFilters
        q={q}
        ack={ack}
        basePath={basePath}
        showAckFilter={showAckFilter}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่ส่ง</th>
              <th className="px-3 py-3 font-medium">เลขที่</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">จาก</th>
              <th className="px-3 py-3 font-medium">ความเร็ว</th>
              <th className="px-3 py-3 font-medium">ตอบรับ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
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
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">{row.subject}</td>
                  <td className="px-3 py-2.5">{row.senderLabel}</td>
                  <td className="px-3 py-2.5">
                    {urgencyLevelLabel(row.urgencyLevel)}
                    <UrgencyLevelBadge
                      level={row.urgencyLevel}
                      className="ml-1"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {row.answered ? (
                      <span className="text-green-700">ตอบรับแล้ว</span>
                    ) : (
                      <span className="text-amber-700">รอตอบรับ</span>
                    )}
                    {row.secretLevel > 0 ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({secretLevelLabel(row.secretLevel)})
                      </span>
                    ) : null}
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
        hrefForPage={hrefForPage}
      />
    </section>
  );
}
