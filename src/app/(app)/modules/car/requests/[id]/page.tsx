import Link from "next/link";
import { notFound } from "next/navigation";
import { CarApproveForm } from "@/components/car/car-approve-form";
import { approveCarRequest } from "@/lib/car/actions";
import { fuelLabel, grantStatusLabel } from "@/lib/car/constants";
import { canApproveCar } from "@/lib/car/permissions";
import { getCarRequest } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

export default async function CarRequestDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const { user, perms } = await requireCarScope();
  const request = await getCarRequest(id);
  if (!request) notFound();

  const canApprove =
    canApproveCar(user, perms) && request.commanderGrant === null;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายละเอียดคำขอใช้รถ</h2>
        <Link
          href="/modules/car/requests"
          className="text-sm text-primary hover:underline"
        >
          ← กลับรายการ
        </Link>
      </div>

      <dl className="divide-y rounded-xl border bg-card shadow-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ผู้ขอ</dt>
          <dd className="sm:col-span-2">{request.displayName}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เลขบัตร</dt>
          <dd className="font-mono text-sm sm:col-span-2">{request.personId}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">วันที่บันทึก</dt>
          <dd className="sm:col-span-2">{request.recDate}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยานพาหนะ</dt>
          <dd className="sm:col-span-2">{request.carLabel}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานที่</dt>
          <dd className="sm:col-span-2">{request.place}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">วัตถุประสงค์</dt>
          <dd className="sm:col-span-2">{request.because}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงวันที่</dt>
          <dd className="sm:col-span-2">
            {request.carStart} – {request.carFinish}
            {request.dayTotal ? ` (${request.dayTotal} วัน)` : ""}
          </dd>
        </div>
        {(request.timeStart || request.timeFinish) && (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">เวลา</dt>
            <dd className="sm:col-span-2">
              {request.timeStart ?? "—"} – {request.timeFinish ?? "—"} น.
            </dd>
          </div>
        )}
        {request.personNum ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ผู้โดยสาร</dt>
            <dd className="sm:col-span-2">{request.personNum} คน</dd>
          </div>
        ) : null}
        {request.controlPerson ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ผู้ควบคุมรถ</dt>
            <dd className="sm:col-span-2">{request.controlPerson}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เชื้อเพลิง</dt>
          <dd className="sm:col-span-2">{fuelLabel(request.fuel)}</dd>
        </div>
        {request.project ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">โครงการ</dt>
            <dd className="sm:col-span-2">{request.project}</dd>
          </div>
        ) : null}
        {request.activity ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">กิจกรรม</dt>
            <dd className="sm:col-span-2">{request.activity}</dd>
          </div>
        ) : null}
        {request.money ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">จำนวนเงิน</dt>
            <dd className="sm:col-span-2">{request.money.toLocaleString("th-TH")} บาท</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานะ</dt>
          <dd className="sm:col-span-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                request.commanderGrant === 1
                  ? "bg-green-100 text-green-800"
                  : request.commanderGrant === 0
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800",
              )}
            >
              {grantStatusLabel(request.commanderGrant)}
            </span>
          </dd>
        </div>
        {request.grantComment ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ความเห็นผู้อนุมัติ</dt>
            <dd className="sm:col-span-2">{request.grantComment}</dd>
          </div>
        ) : null}
        {request.commanderDate ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">วันที่พิจารณา</dt>
            <dd className="sm:col-span-2">{formatDateTime(request.commanderDate)}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยื่นเมื่อ</dt>
          <dd className="sm:col-span-2">{formatDateTime(request.createdAt)}</dd>
        </div>
      </dl>

      {canApprove ? (
        <CarApproveForm action={approveCarRequest.bind(null, id)} />
      ) : null}
    </section>
  );
}
