import { ListPagination } from "@/components/core/list-pagination";
import { IdocumentListFilters } from "@/components/idocument/idocument-list-filters";
import { IdocumentListTable } from "@/components/idocument/idocument-list-table";
import { buildIdocumentListUrl } from "@/lib/idocument/list-url";
import {
  countCompletedDocuments,
  IDOCUMENT_PAGE_SIZE,
  listCompletedDocumentsPage,
  parseIdocumentListParams,
  resolveIdocumentListPage,
} from "@/lib/idocument/queries";
import { requireIdocumentScope } from "@/lib/idocument/scope";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

const LIST_PATH = "/modules/idocument/reports";

export default async function IdocumentReportsPage({ searchParams }: Props) {
  const { user, canViewAllReports } = await requireIdocumentScope();
  const params = await searchParams;
  const parsed = parseIdocumentListParams(params);
  const total = await countCompletedDocuments({
    officerPersonId: user.personId,
    viewAll: canViewAllReports,
    q: parsed.q,
  });
  const page = await resolveIdocumentListPage(total, parsed.page);
  const rows = await listCompletedDocumentsPage({
    officerPersonId: user.personId,
    viewAll: canViewAllReports,
    page,
    q: parsed.q,
  });
  const totalPages = Math.max(1, Math.ceil(total / IDOCUMENT_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          บันทึกข้อความทั้งหมด
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} รายการ (สถานะเสร็จสิ้น)
          {!canViewAllReports ? " — เฉพาะของตัวเอง" : ""}
        </p>
      </div>

      <IdocumentListFilters basePath={LIST_PATH} q={parsed.q} />

      <IdocumentListTable
        rows={rows}
        emptyMessage="ไม่พบรายการที่เสร็จสิ้น"
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
