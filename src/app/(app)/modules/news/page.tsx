import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { NewsDeleteButton } from "@/components/news/news-delete-button";
import { NewsListFilters } from "@/components/news/news-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildNewsArticlesUrl } from "@/lib/news/list-url";
import {
  canWriteNews,
  getNewsPermissions,
} from "@/lib/news/permissions";
import {
  NEWS_PAGE_SIZE,
  countNewsArticles,
  getActiveNewsMainitem,
  listNewsArticlesPage,
  listNewsSectionsForMainitem,
  parseNewsListParams,
  resolveNewsListPage,
} from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; section?: string }>;
};

export default async function NewsArticlesPage({ searchParams }: Props) {
  const { user } = await requireNewsScope();
  const perms = await getNewsPermissions(Number(user.id));
  const canWrite = canWriteNews(user, perms);

  const active = await getActiveNewsMainitem();
  if (!active) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        ยังไม่ได้กำหนดชื่อเรื่องเพื่อทำงานปัจจุบัน — ไปที่เมนู &quot;ชื่อเรื่อง&quot;
        (ผู้ดูแลโมดูล)
      </section>
    );
  }

  const params = await searchParams;
  const parsed = parseNewsListParams(params);
  const sections = await listNewsSectionsForMainitem(active.code);
  const total = await countNewsArticles(
    active.code,
    parsed.q,
    parsed.sectionCode,
  );
  const page = await resolveNewsListPage(total, parsed.page);
  const rows = await listNewsArticlesPage({
    mainitemCode: active.code,
    page,
    q: parsed.q,
    sectionCode: parsed.sectionCode,
  });
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">{active.mainitem}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/news/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            เพิ่มข่าว
          </Link>
        ) : null}
      </div>

      <NewsListFilters
        q={parsed.q}
        sectionCode={parsed.sectionCode}
        sections={sections}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">ข่าว</th>
              <th className="px-3 py-3 text-center font-medium">ไฟล์</th>
              {canWrite ? (
                <>
                  <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
                  <th className="px-3 py-3 text-center font-medium">ลบ</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 6 : 4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข่าว
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.reportDate.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5">{row.sectionLabel}</td>
                  <td className="px-3 py-2.5">{row.news}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.hasFile ? (
                      <a
                        href={`/api/news/${row.id}/download`}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        เปิด
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {canWrite ? (
                    <>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          href={`/modules/news/${row.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          แก้ไข
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <NewsDeleteButton id={row.id} />
                      </td>
                    </>
                  ) : null}
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
          buildNewsArticlesUrl({
            page: p,
            q: parsed.q || undefined,
            section: parsed.sectionCode || undefined,
          })
        }
      />
    </section>
  );
}
