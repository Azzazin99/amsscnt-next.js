import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { CabinetDeleteButton } from "@/components/cabinet/cabinet-delete-button";
import { CabinetListFilters } from "@/components/cabinet/cabinet-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildCabinetListUrl } from "@/lib/cabinet/list-url";
import {
  canUploadCabinet,
  getCabinetPermissions,
} from "@/lib/cabinet/permissions";
import {
  CABINET_PAGE_SIZE,
  countCabinetDocuments,
  listCabinetDocumentsPage,
  parseCabinetListParams,
  resolveCabinetListPage,
} from "@/lib/cabinet/queries";
import { requireCabinetScope } from "@/lib/cabinet/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CabinetListPage({ searchParams }: Props) {
  const { user } = await requireCabinetScope();
  const perms = await getCabinetPermissions(Number(user.id));
  const canUpload = canUploadCabinet(user, perms);

  const params = await searchParams;
  const parsed = parseCabinetListParams(params);
  const total = await countCabinetDocuments(parsed.q);
  const page = await resolveCabinetListPage(total, parsed.page);
  const rows = await listCabinetDocumentsPage({ page, q: parsed.q });
  const totalPages = Math.max(1, Math.ceil(total / CABINET_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">ตู้เอกสารกลาง</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canUpload ? (
          <Link
            href="/modules/cabinet/upload"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            อัปโหลดเอกสาร
          </Link>
        ) : null}
      </div>

      <CabinetListFilters q={parsed.q} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ชื่อเรื่อง</th>
              <th className="px-3 py-3 font-medium">ชนิด</th>
              <th className="px-3 py-3 font-medium">ขนาด</th>
              <th className="px-3 py-3 font-medium">ผู้บันทึก</th>
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 text-center font-medium">เปิด</th>
              {canUpload ? (
                <th className="px-3 py-3 text-center font-medium">ลบ</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canUpload ? 7 : 6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบเอกสาร
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.docSubject}</td>
                  <td className="px-3 py-2.5 uppercase">{row.docType}</td>
                  <td className="px-3 py-2.5">{formatSize(row.docSize)}</td>
                  <td className="px-3 py-2.5">{row.personLabel}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.recDate.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <a
                      href={`/api/cabinet/${row.id}/download`}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ดาวน์โหลด
                    </a>
                  </td>
                  {canUpload ? (
                    <td className="px-3 py-2.5 text-center">
                      <CabinetDeleteButton id={row.id} />
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildCabinetListUrl({ page: p, q: parsed.q || undefined })
        }
      />
    </section>
  );
}
