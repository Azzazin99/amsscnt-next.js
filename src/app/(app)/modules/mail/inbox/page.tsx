import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { MailListFilters } from "@/components/mail/mail-list-filters";
import { buildMailInboxUrl } from "@/lib/mail/list-url";
import {
  MAIL_PAGE_SIZE,
  countMailInbox,
  listMailInboxPage,
  parseMailListParams,
  resolveMailListPage,
} from "@/lib/mail/queries";
import { requireMailScope } from "@/lib/mail/scope";
import { formatThaiDate } from "@/lib/format/thai-date";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; ack?: string }>;
};

export default async function MailInboxPage({ searchParams }: Props) {
  const { user } = await requireMailScope();
  const params = await searchParams;
  const parsed = parseMailListParams(params);
  const total = await countMailInbox(user.personId, parsed.q, parsed.ack);
  const page = await resolveMailListPage(total, parsed.page);
  const rows = await listMailInboxPage({
    personId: user.personId,
    ...parsed,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / MAIL_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนจดหมายรับมา
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} ฉบับ
        </p>
      </div>

      <MailListFilters
        q={parsed.q}
        ack={parsed.ack}
        basePath="/modules/mail/inbox"
        showAckFilter
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่ส่ง</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">ผู้ส่ง</th>
              <th className="px-3 py-3 font-medium">ตอบรับ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบรายการทะเบียนรับ
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
                      href={`/modules/mail/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.subject}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">{row.senderLabel}</td>
                  <td className="px-3 py-2.5">
                    {row.answered ? (
                      <span className="text-green-700">ตอบรับแล้ว</span>
                    ) : (
                      <span className="text-amber-700">รอตอบรับ</span>
                    )}
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
        hrefForPage={(p) => buildMailInboxUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
