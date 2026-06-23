import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { IdocumentListFilters } from "@/components/idocument/idocument-list-filters";
import { IdocumentListTable } from "@/components/idocument/idocument-list-table";
import { buttonVariants } from "@/components/ui/button";
import { buildIdocumentListUrl } from "@/lib/idocument/list-url";
import {
  countMyDocuments,
  IDOCUMENT_PAGE_SIZE,
  listMyDocumentsPage,
  parseIdocumentListParams,
  resolveIdocumentListPage,
} from "@/lib/idocument/queries";
import { requireIdocumentScope } from "@/lib/idocument/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

const LIST_PATH = "/modules/idocument";

export default async function IdocumentListPage({ searchParams }: Props) {
  const { user, canWrite } = await requireIdocumentScope();
  const params = await searchParams;
  const parsed = parseIdocumentListParams(params);
  const total = await countMyDocuments(user.personId, parsed.q);
  const page = await resolveIdocumentListPage(total, parsed.page);
  const rows = await listMyDocumentsPage({
    officerPersonId: user.personId,
    page,
    q: parsed.q,
  });
  const totalPages = Math.max(1, Math.ceil(total / IDOCUMENT_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            รายการบันทึกเสนอ
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/idocument/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            เพิ่มบันทึกเสนอ
          </Link>
        ) : null}
      </div>

      <IdocumentListFilters basePath={LIST_PATH} q={parsed.q} />

      <IdocumentListTable
        rows={rows}
        canWrite={canWrite}
        emptyMessage="ไม่พบรายการบันทึกเสนอ"
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
