import { ReceiveListDataTable } from "@/components/bookregister/receive/receive-list-data-table";
import { ReceivePagination } from "@/components/bookregister/receive-pagination";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import type { ListSearchFilters } from "@/lib/bookregister/list-search-params";
import { resolveListPage } from "@/lib/bookregister/list-search-params";
import {
  RECEIVE_PAGE_SIZE,
  countDistrictReceives,
  listDistrictReceives,
} from "@/lib/bookregister/receive/queries";
import type { BookregisterScope } from "@/lib/bookregister/scope";

type ReceiveListSectionProps = {
  scope: BookregisterScope;
  userId: number;
  filters: ListSearchFilters;
  baseParams: Record<string, string | undefined>;
  pageParam?: string;
  canWrite: boolean;
  canDeletePerm: boolean;
  isModuleAdmin: boolean;
  visibility: RegisterListVisibility;
};

export async function ReceiveListSection({
  scope,
  userId,
  filters,
  baseParams,
  pageParam,
  canWrite,
  canDeletePerm,
  isModuleAdmin,
  visibility,
}: ReceiveListSectionProps) {
  const total = await countDistrictReceives(scope, filters, visibility);
  const totalPages = Math.max(1, Math.ceil(total / RECEIVE_PAGE_SIZE));
  const parsed = {
    q: filters.q ?? "",
    workgroupId: filters.workgroupId,
    page: 1,
    filters,
    baseParams,
  };
  const page = resolveListPage(parsed, { page: pageParam }, totalPages);

  const rows = await listDistrictReceives(
    scope,
    filters,
    page,
    RECEIVE_PAGE_SIZE,
    {
      userId,
      canWrite,
      canDeletePerm,
      isModuleAdmin,
    },
    visibility,
  );

  return (
    <>
      <ReceiveListDataTable rows={rows} />
      <ReceivePagination
        page={page}
        totalPages={totalPages}
        baseParams={baseParams}
        basePath="/modules/bookregister/receive"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        แสดง {rows.length} รายการจากทั้งหมด {total.toLocaleString("th-TH")}{" "}
        รายการ · หน้า {page}/{totalPages}
      </p>
    </>
  );
}
