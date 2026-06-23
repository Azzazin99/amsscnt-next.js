import { CommandListDataTable } from "@/components/bookregister/command/command-list-data-table";
import { ReceivePagination } from "@/components/bookregister/receive-pagination";
import type { Session } from "next-auth";
import {
  COMMAND_PAGE_SIZE,
  countDistrictCommands,
  listDistrictCommands,
  type CommandListFilters,
} from "@/lib/bookregister/command/queries";
import { resolveListPage } from "@/lib/bookregister/list-search-params";
import type { BookregisterPermissionFlags } from "@/lib/bookregister/permissions";

type CommandListSectionProps = {
  session: Session;
  filters: CommandListFilters;
  baseParams: Record<string, string | undefined>;
  pageParam?: string;
  canWrite: boolean;
  canDeletePerm: boolean;
  perms: BookregisterPermissionFlags;
};

export async function CommandListSection({
  session,
  filters,
  baseParams,
  pageParam,
  canWrite,
  canDeletePerm,
  perms,
}: CommandListSectionProps) {
  const total = await countDistrictCommands(filters);
  const totalPages = Math.max(1, Math.ceil(total / COMMAND_PAGE_SIZE));
  const parsed = {
    q: filters.q ?? "",
    workgroupId: undefined,
    page: 1,
    filters,
    baseParams,
  };
  const page = resolveListPage(parsed, { page: pageParam }, totalPages);

  const rows = await listDistrictCommands(filters, page, COMMAND_PAGE_SIZE, {
    user: session.user!,
    canWrite,
    canDeletePerm,
    perms,
  });

  return (
    <>
      <CommandListDataTable rows={rows} />
      <ReceivePagination
        page={page}
        totalPages={totalPages}
        baseParams={baseParams}
        basePath="/modules/bookregister/command"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        แสดง {rows.length} รายการจากทั้งหมด {total.toLocaleString("th-TH")}{" "}
        รายการ · หน้า {page}/{totalPages}
      </p>
    </>
  );
}
