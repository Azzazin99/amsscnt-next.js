import type { Session } from "next-auth";
import { ReceivePagination } from "@/components/bookregister/receive-pagination";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import {
  CERTIFICATE_PAGE_SIZE,
  countDistrictCertificates,
  listDistrictCertificates,
  type CertificateListFilters,
  type DistrictCertificateRow,
  type CertificateRowActionContext,
} from "@/lib/bookregister/certificate/queries";
import { resolveListPage } from "@/lib/bookregister/list-search-params";
import { CertificateListDataTable } from "@/components/bookregister/certificate/certificate-list-data-table";
import type { BookregisterPermissionFlags } from "@/lib/bookregister/permissions";

type CertificateListSectionProps = {
  session: Session;
  filters: CertificateListFilters;
  baseParams: Record<string, string | undefined>;
  pageParam?: string;
  canWrite: boolean;
  canDeletePerm: boolean;
  perms: BookregisterPermissionFlags;
  visibility: RegisterListVisibility;
};

export async function CertificateListSection({
  session,
  filters,
  baseParams,
  pageParam,
  canWrite,
  canDeletePerm,
  perms,
  visibility,
}: CertificateListSectionProps) {
  const total = await countDistrictCertificates(filters, visibility);
  const totalPages = Math.max(1, Math.ceil(total / CERTIFICATE_PAGE_SIZE));

  const parsed = {
    q: filters.q ?? "",
    workgroupId: undefined,
    page: 1,
    filters,
    baseParams,
  };

  const page = resolveListPage(parsed, { page: pageParam }, totalPages);

  const rows: DistrictCertificateRow[] = await listDistrictCertificates(
    filters,
    page,
    CERTIFICATE_PAGE_SIZE,
    {
      user: session.user!,
      canWrite,
      canDeletePerm,
      perms,
    } satisfies CertificateRowActionContext,
    visibility,
  );

  return (
    <>
      <CertificateListDataTable rows={rows} />
      <ReceivePagination
        page={page}
        totalPages={totalPages}
        baseParams={baseParams}
        basePath="/modules/bookregister/certificate"
      />
      <p className="mt-3 text-xs text-muted-foreground">
        แสดง {rows.length} รายการจากทั้งหมด {total.toLocaleString("th-TH")}{" "}
        รายการ · หน้า {page}/{totalPages}
      </p>
    </>
  );
}

