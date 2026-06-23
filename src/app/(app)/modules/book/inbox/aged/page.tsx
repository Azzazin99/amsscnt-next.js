import { BookInboxSection } from "@/components/book/book-inbox-section";
import { canAccessBookSecretLevel } from "@/lib/book/permissions";
import { buildBookInboxAgedUrl } from "@/lib/book/list-url";
import {
  BOOK_PAGE_SIZE,
  countBookInbox,
  listBookInboxPage,
  parseBookListParams,
  resolveBookListPage,
} from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; ack?: string }>;
};

export default async function BookInboxAgedPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireBookScope();
  const params = await searchParams;
  const parsed = parseBookListParams(params);
  const total = await countBookInbox(scope, parsed.q, parsed.ack, "aged_2y");
  const page = await resolveBookListPage(total, parsed.page);
  const rows = await listBookInboxPage({
    ...parsed,
    page,
    scope,
    filter: "aged_2y",
  });
  const totalPages = Math.max(1, Math.ceil(total / BOOK_PAGE_SIZE));

  const visibleRows = rows.filter((row) =>
    canAccessBookSecretLevel(user, perms, row.secretLevel),
  );

  return (
    <BookInboxSection
      title="หนังสืออายุเกิน 2 ปี"
      subtitle="นับจากลงวันที่หนังสือ (sign_date) — เทียบ amsscnt.com"
      total={total}
      rows={visibleRows}
      page={page}
      totalPages={totalPages}
      q={parsed.q}
      ack={parsed.ack}
      basePath="/modules/book/inbox/aged"
      showAckFilter
      emptyMessage="ไม่พบหนังสืออายุเกิน 2 ปี"
      hrefForPage={(p) => buildBookInboxAgedUrl({ ...parsed, page: p })}
    />
  );
}
