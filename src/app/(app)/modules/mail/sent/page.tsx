import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { MailListFilters } from "@/components/mail/mail-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildMailSentUrl } from "@/lib/mail/list-url";
import { canWriteMail } from "@/lib/mail/permissions";
import {
  MAIL_PAGE_SIZE,
  countMailSent,
  listMailSentPage,
  parseMailListParams,
  resolveMailListPage,
} from "@/lib/mail/queries";
import { requireMailScope } from "@/lib/mail/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function MailSentPage({ searchParams }: Props) {
  const { user, perms } = await requireMailScope();
  const params = await searchParams;
  const parsed = parseMailListParams(params);
  const total = await countMailSent(user.personId, parsed.q);
  const page = await resolveMailListPage(total, parsed.page);
  const rows = await listMailSentPage({
    senderPersonId: user.personId,
    ...parsed,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / MAIL_PAGE_SIZE));
  const canWrite = canWriteMail(user, perms);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ทะเบียนจดหมายส่งไป
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} ฉบับ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/mail/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            เขียนจดหมาย
          </Link>
        ) : null}
      </div>

      <MailListFilters q={parsed.q} ack="all" basePath="/modules/mail/sent" />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่ส่ง</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">ผู้รับ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบรายการทะเบียนส่ง
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
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.recipientCount.toLocaleString("th-TH")} ราย
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
        hrefForPage={(p) => buildMailSentUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
