import { SendListDataTable } from "@/components/bookregister/send/send-list-data-table";
import { ReceivePagination } from "@/components/bookregister/receive-pagination";
import {
  SEND_PAGE_SIZE,
  countDistrictSends,
  listDistrictSends,
} from "@/lib/bookregister/send/queries";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import type { ListSearchFilters } from "@/lib/bookregister/list-search-params";
import { resolveListPage } from "@/lib/bookregister/list-search-params";
import type { BookregisterScope } from "@/lib/bookregister/scope";

type SendListSectionProps = {
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

export async function SendListSection({
  scope,
  userId,
  filters,
  baseParams,
  pageParam,
  canWrite,
  canDeletePerm,
  isModuleAdmin,
  visibility,
}: SendListSectionProps) {
  const total = await countDistrictSends(scope, filters, visibility);
  const totalPages = Math.max(1, Math.ceil(total / SEND_PAGE_SIZE));
  const parsed = {
    q: filters.q ?? "",
    workgroupId: filters.workgroupId,
    page: 1,
    filters,
    baseParams,
  };
  const page = resolveListPage(parsed, { page: pageParam }, totalPages);

  const rows = await listDistrictSends(
    scope,
    filters,
    page,
    SEND_PAGE_SIZE,
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
      <SendListDataTable rows={rows} />
      <ReceivePagination
        page={page}
        totalPages={totalPages}
        baseParams={baseParams}
        basePath="/modules/bookregister/send"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        แสดง {rows.length} รายการจากทั้งหมด {total.toLocaleString("th-TH")}{" "}
        รายการ · หน้า {page}/{totalPages}
      </p>
    </>
  );
}
