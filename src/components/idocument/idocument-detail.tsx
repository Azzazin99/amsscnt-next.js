import Link from "next/link";
import {
  IdocumentStatusBadge,
  IdocumentTypeBadge,
} from "@/components/idocument/idocument-status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { IdocumentCommentRow } from "@/lib/idocument/queries";
import { canEditIdocumentStatus } from "@/lib/idocument/status";
import { cn } from "@/lib/utils";

type DocumentRow = {
  id: number;
  bookNo: string;
  bookDate: string;
  subject: string;
  bookTo: string;
  workgroupTxt: string;
  officerName: string;
  officerPosition: string;
  bookStatus: number;
  bookType: number;
  preDocId: string;
  content1: string;
  content2: string;
  content3: string;
};

type IdocumentDetailProps = {
  document: DocumentRow;
  comments: IdocumentCommentRow[];
  canWrite: boolean;
  isOwner: boolean;
};

function formatCommentDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(value);
}

export function IdocumentDetail({
  document,
  comments,
  canWrite,
  isOwner,
}: IdocumentDetailProps) {
  const editable =
    canWrite && isOwner && canEditIdocumentStatus(document.bookStatus);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            บันทึกข้อความ {document.bookNo}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ลงวันที่ {document.bookDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IdocumentTypeBadge bookType={document.bookType} />
          <IdocumentStatusBadge
            bookStatus={document.bookStatus}
            preDocId={document.preDocId}
          />
          {editable ? (
            <Link
              href={`/modules/idocument/${document.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
            >
              แก้ไข
            </Link>
          ) : null}
          <Link
            href="/modules/idocument"
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-10")}
          >
            กลับรายการ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">เรื่อง</p>
          <p className="text-sm">{document.subject}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">เรียน</p>
          <p className="text-sm">{document.bookTo}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">กลุ่มงาน</p>
          <p className="text-sm">{document.workgroupTxt}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">ผู้บันทึก</p>
          <p className="text-sm">
            {document.officerName}
            {document.officerPosition
              ? ` — ${document.officerPosition}`
              : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold">เรื่องเดิม</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{document.content1}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">ข้อเท็จจริง</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{document.content2}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">จึงเรียนมาเพื่อ</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{document.content3}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">ประวัติความเห็น</h3>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">ผู้ลงความเห็น</th>
                <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-3 py-3 font-medium">ความเห็น</th>
                <th className="px-3 py-3 font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {comments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    ยังไม่มีความเห็น
                  </td>
                </tr>
              ) : (
                comments.map((comment, i) => (
                  <tr
                    key={comment.id}
                    className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                  >
                    <td className="px-3 py-2.5">{comment.personCommentsName}</td>
                    <td className="px-3 py-2.5">
                      {comment.personCommentsPosition}
                    </td>
                    <td className="px-3 py-2.5">
                      {comment.commentsTxt ||
                        comment.commentsEtctxt ||
                        comment.commentsSelect ||
                        "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatCommentDate(comment.commentsDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
