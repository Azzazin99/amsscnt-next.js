import { ListPagination } from "@/components/core/list-pagination";
import { IdocumentListFilters } from "@/components/idocument/idocument-list-filters";
import { IdocumentListTable } from "@/components/idocument/idocument-list-table";
import { buildIdocumentListUrl } from "@/lib/idocument/list-url";
import {
  countInboxDocuments,
  IDOCUMENT_PAGE_SIZE,
  listInboxDocumentsPage,
  parseIdocumentListParams,
  resolveIdocumentListPage,
} from "@/lib/idocument/queries";
import { requireIdocumentInboxAccess } from "@/lib/idocument/scope";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

const LIST_PATH = "/modules/idocument/inbox";

export default async function IdocumentInboxPage({ searchParams }: Props) {
  const { user } = await requireIdocumentInboxAccess();
  const params = await searchParams;
  const parsed = parseIdocumentListParams(params);
  const total = await countInboxDocuments(user.personId, parsed.q);
  const page = await resolveIdocumentListPage(total, parsed.page);
  const rows = await listInboxDocumentsPage({
    personId: user.personId,
    page,
    q: parsed.q,
  });
  const totalPages = Math.max(1, Math.ceil(total / IDOCUMENT_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ลงความเห็น/สั่งการ
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} รายการรอดำเนินการ
        </p>
      </div>

      <IdocumentListFilters
        basePath={LIST_PATH}
        q={parsed.q}
        placeholder="เลขที่ / เรื่อง / เรียน"
      />

      <IdocumentListTable
        rows={rows}
        emptyMessage="ไม่มีรายการรอลงความเห็น"
        showBookTo
      />

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildIdocumentListUrl(LIST_PATH, {
            page: p,
            q: parsed.q || undefined,
          })
        }
      />
    </section>
  );
}
