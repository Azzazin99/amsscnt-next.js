import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/book/book-print-button";
import { buttonVariants } from "@/components/ui/button";
import { canAccessBookSecretLevel } from "@/lib/book/permissions";
import { canViewBookDocument, getBookDocument } from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";
import {
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

const DISTRICT_NAME =
  "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท";

export default async function BookPrintPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireBookScope();
  const doc = await getBookDocument(id);
  if (!doc) notFound();

  if (!canAccessBookSecretLevel(user, perms, doc.secretLevel)) {
    notFound();
  }

  const canView = await canViewBookDocument(doc, scope);
  if (!canView) notFound();

  return (
    <div className="print-page mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm print:shadow-none">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap gap-2">
        <Link
          href={`/modules/book/${id}`}
          className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
        >
          กลับรายละเอียด
        </Link>
        <PrintButton />
      </div>

      <header className="mb-8 text-center">
        <p className="text-sm">{DISTRICT_NAME}</p>
        <p className="mt-1 text-xs text-gray-600">ที่ {doc.bookNo}</p>
        <p className="text-xs text-gray-600">
          วันที่ {formatThaiDate(doc.signDate)}
        </p>
      </header>

      <section className="mb-6 space-y-4 text-sm leading-relaxed">
        <p>
          <span className="font-semibold">เรื่อง</span> {doc.subject}
        </p>
        {doc.detail ? (
          <div className="whitespace-pre-wrap pl-8">{doc.detail}</div>
        ) : null}
        <p className="text-xs text-gray-600">
          ชั้นความเร็ว: {urgencyLevelLabel(doc.urgencyLevel)} · ชั้นความลับ:{" "}
          {secretLevelLabel(doc.secretLevel)}
        </p>
      </section>

      <section className="mb-12 min-h-[4rem] text-sm">
        <p className="font-semibold">คำลงท้าย</p>
        <p className="mt-2 text-gray-600 italic">
          (ข้อความคำลงท้ายมาตรฐาน — รอการกำหนดจากเขต)
        </p>
      </section>

      <footer className="mt-16 text-center text-sm">
        <p>ขอแสดงความนับถือ</p>
        <div className="mx-auto mt-12 h-16 w-48 border-b border-gray-400" />
        <p className="mt-2">(ลายเซ็น / ตำแหน่งผู้ลงนาม)</p>
        <p className="mt-1 text-xs text-gray-600">{DISTRICT_NAME}</p>
      </footer>
    </div>
  );
}
