import Link from "next/link";
import {
  IdocumentStatusBadge,
  IdocumentTypeBadge,
} from "@/components/idocument/idocument-status-badge";
import { canEditIdocumentStatus } from "@/lib/idocument/status";
import type { IdocumentListRow } from "@/lib/idocument/queries";

type IdocumentListTableProps = {
  rows: IdocumentListRow[];
  canWrite?: boolean;
  emptyMessage: string;
  showBookTo?: boolean;
  detailBasePath?: string;
};

export function IdocumentListTable({
  rows,
  canWrite = false,
  emptyMessage,
  showBookTo = false,
  detailBasePath = "/modules/idocument",
}: IdocumentListTableProps) {
  const colCount = 6 + (showBookTo ? 1 : 0) + (canWrite ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">เลขที่</th>
            <th className="px-3 py-3 font-medium">ลงวันที่</th>
            <th className="px-3 py-3 font-medium">ความเร่งด่วน</th>
            <th className="px-3 py-3 font-medium">เรื่อง</th>
            {showBookTo ? (
              <th className="px-3 py-3 font-medium">เรียน</th>
            ) : null}
            <th className="px-3 py-3 font-medium">กลุ่มงาน</th>
            <th className="px-3 py-3 font-medium">ผู้บันทึก</th>
            <th className="px-3 py-3 font-medium">สถานะ</th>
            {canWrite ? (
              <th className="px-3 py-3 text-center font-medium">ดำเนินการ</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Link
                    href={`${detailBasePath}/${row.id}`}
                    className="text-primary hover:underline"
                  >
                    {row.bookNo}
                  </Link>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{row.bookDate}</td>
                <td className="px-3 py-2.5">
                  <IdocumentTypeBadge bookType={row.bookType} />
                </td>
                <td className="px-3 py-2.5">{row.subject}</td>
                {showBookTo ? (
                  <td className="px-3 py-2.5">{row.bookTo}</td>
                ) : null}
                <td className="px-3 py-2.5">{row.workgroupTxt}</td>
                <td className="px-3 py-2.5">{row.officerName}</td>
                <td className="px-3 py-2.5">
                  <IdocumentStatusBadge
                    bookStatus={row.bookStatus}
                    preDocId={row.preDocId}
                  />
                </td>
                {canWrite ? (
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <Link
                      href={`${detailBasePath}/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      ดู
                    </Link>
                    {canEditIdocumentStatus(row.bookStatus) ? (
                      <>
                        {" · "}
                        <Link
                          href={`${detailBasePath}/${row.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          แก้ไข
                        </Link>
                      </>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
