import { BookInboxSection } from "@/components/book/book-inbox-section";
import { canAccessBookSecretLevel } from "@/lib/book/permissions";
import { buildBookInboxUrl } from "@/lib/book/list-url";
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

export default async function BookInboxPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireBookScope();
  const params = await searchParams;
  const parsed = parseBookListParams(params);
  const total = await countBookInbox(scope, parsed.q, parsed.ack, "all");
  const page = await resolveBookListPage(total, parsed.page);
  const rows = await listBookInboxPage({ ...parsed, page, scope, filter: "all" });
  const totalPages = Math.max(1, Math.ceil(total / BOOK_PAGE_SIZE));

  const visibleRows = rows.filter((row) =>
    canAccessBookSecretLevel(user, perms, row.secretLevel),
  );

  return (
    <BookInboxSection
      title="หนังสือรับ"
      total={total}
      rows={visibleRows}
      page={page}
      totalPages={totalPages}
      q={parsed.q}
      ack={parsed.ack}
      basePath="/modules/book/inbox"
      showAckFilter
      emptyMessage="ไม่พบหนังสือรับ"
      hrefForPage={(p) => buildBookInboxUrl({ ...parsed, page: p })}
    />
  );
}
