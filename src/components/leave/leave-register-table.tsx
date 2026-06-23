import Link from "next/link";
import {
  Check,
  Download,
  Eye,
  Pencil,
} from "lucide-react";
import { LeaveRequestDeleteButton } from "@/components/leave/leave-request-delete-button";
import { formatThaiDate } from "@/lib/format/thai-date";
import {
  canMutateOwnLeaveRequest,
  type LeaveListRow,
} from "@/lib/leave/queries";
import { cn } from "@/lib/utils";

type LeaveRegisterTableProps = {
  rows: LeaveListRow[];
  viewerPersonId: string;
};

function requestDateLabel(row: LeaveListRow): string {
  return formatThaiDate(row.createdAt);
}

export function LeaveRegisterTable({
  rows,
  viewerPersonId,
}: LeaveRegisterTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">เลขที่</th>
            <th className="px-3 py-3 font-medium">วันขออนุญาต</th>
            <th className="px-3 py-3 font-medium">ประเภทการลา</th>
            <th className="px-3 py-3 font-medium">ตั้งแต่วันที่</th>
            <th className="px-3 py-3 font-medium">ถึงวันที่</th>
            <th className="px-3 py-3 text-center font-medium">มีกำหนด</th>
            <th className="px-3 py-3 font-medium">เอกสาร</th>
            <th className="px-3 py-3 text-center font-medium">อนุมัติ/คำสั่ง</th>
            <th className="px-3 py-3 text-center font-medium">ดาวน์โหลดเอกสาร</th>
            <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            <th className="px-3 py-3 text-center font-medium">ลบ</th>
            <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={12}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                ไม่พบคำขอลา
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const canMutate = canMutateOwnLeaveRequest(row, viewerPersonId);
              return (
                <tr
                  key={row.id}
                  className={cn(index % 2 === 0 ? "bg-card" : "bg-muted/20")}
                >
                  <td className="px-3 py-2.5">{row.id}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {requestDateLabel(row)}
                  </td>
                  <td className="px-3 py-2.5">{row.leaveTypeLabel}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.leaveStart)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.leaveFinish)}
                  </td>
                  <td className="px-3 py-2.5 text-center">{row.leaveTotal}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.documentName?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.commanderGrant === 1 ? (
                      <Check
                        className="mx-auto size-4 text-green-600 dark:text-green-400"
                        aria-label="อนุมัติแล้ว"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.firstFileId ? (
                      <Link
                        href={`/api/leave/requests/${row.id}/files/${row.firstFileId}`}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                        aria-label="ดาวน์โหลดเอกสาร"
                      >
                        <Download className="size-4" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/leave/requests/${row.id}`}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                      aria-label="รายละเอียดคำขอลา"
                    >
                      <Eye className="size-4" aria-hidden />
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {canMutate ? (
                      <LeaveRequestDeleteButton id={row.id} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {canMutate ? (
                      <Link
                        href={`/modules/leave/requests/${row.id}/edit`}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                        aria-label="แก้ไขคำขอลา"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
