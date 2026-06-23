import { BookInboxSection } from "@/components/book/book-inbox-section";
import { canAccessBookSecretLevel } from "@/lib/book/permissions";
import { buildBookInboxOverdueUrl } from "@/lib/book/list-url";
import {
  BOOK_PAGE_SIZE,
  countBookInbox,
  listBookInboxPage,
  parseBookListParams,
  resolveBookListPage,
} from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function BookInboxOverduePage({ searchParams }: Props) {
  const { user, perms, scope } = await requireBookScope();
  const params = await searchParams;
  const parsed = parseBookListParams(params);
  const total = await countBookInbox(
    scope,
    parsed.q,
    "pending",
    "overdue_unack",
  );
  const page = await resolveBookListPage(total, parsed.page);
  const rows = await listBookInboxPage({
    scope,
    page,
    q: parsed.q,
    ack: "pending",
    filter: "overdue_unack",
  });
  const totalPages = Math.max(1, Math.ceil(total / BOOK_PAGE_SIZE));

  const visibleRows = rows.filter((row) =>
    canAccessBookSecretLevel(user, perms, row.secretLevel),
  );

  return (
    <BookInboxSection
      title="หนังสือที่ยังไม่รับเกิน 3 วัน"
      subtitle="หนังสือรับที่ยังไม่ตอบรับ และส่งเข้าระบบเกิน 3 วัน (timezone Bangkok)"
      total={total}
      rows={visibleRows}
      page={page}
      totalPages={totalPages}
      q={parsed.q}
      ack="pending"
      basePath="/modules/book/inbox/overdue"
      showAckFilter={false}
      emptyMessage="ไม่พบหนังสือที่ยังไม่รับเกิน 3 วัน"
      hrefForPage={(p) => buildBookInboxOverdueUrl({ q: parsed.q, page: p })}
    />
  );
}
