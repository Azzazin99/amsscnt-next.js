import Link from "next/link";
import { notFound } from "next/navigation";
import { MeetingApproveForm } from "@/components/meeting/meeting-approve-form";
import { MeetingBookingDeleteButton } from "@/components/meeting/meeting-booking-delete-button";
import { approveMeetingBooking } from "@/lib/meeting/actions";
import { canApproveMeeting } from "@/lib/meeting/permissions";
import { getMeetingBooking } from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date): string {
  return value.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function approveBadgeClass(approve: number | null): string {
  if (approve === 1) {
    return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200";
  }
  if (approve === 2) {
    return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
}

export default async function MeetingBookingDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const { user, perms } = await requireMeetingScope();
  const booking = await getMeetingBooking(id);
  if (!booking) notFound();

  const canApprove =
    canApproveMeeting(user, perms) && booking.approve === null;
  const canDelete = booking.bookPersonId === user.personId;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายละเอียดการจอง</h2>
        <Link
          href="/modules/meeting/bookings"
          className="text-sm text-primary hover:underline"
        >
          ← กลับรายการ
        </Link>
      </div>

      <dl className="divide-y rounded-xl border bg-card shadow-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ห้องประชุม</dt>
          <dd className="sm:col-span-2">{booking.roomName}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงวันใช้ห้อง</dt>
          <dd className="sm:col-span-2">
            {booking.bookDate}
            {booking.bookDateEnd !== booking.bookDate
              ? ` – ${booking.bookDateEnd}`
              : ""}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เวลา</dt>
          <dd className="sm:col-span-2">
            {booking.startTimeLabel} – {booking.finishTimeLabel}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">วัตถุประสงค์</dt>
          <dd className="sm:col-span-2">{booking.objective}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">จำนวนผู้เข้าประชุม</dt>
          <dd className="sm:col-span-2">{booking.personNum ?? "—"} คน</dd>
        </div>
        {booking.other ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">อื่น ๆ</dt>
            <dd className="sm:col-span-2">{booking.other}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ผู้จอง</dt>
          <dd className="sm:col-span-2">{booking.displayName}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">วันเวลาจอง</dt>
          <dd className="sm:col-span-2">{formatDateTime(booking.recDate)}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานะ</dt>
          <dd className="sm:col-span-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                approveBadgeClass(booking.approve),
              )}
            >
              {booking.approveStatusLabel}
            </span>
          </dd>
        </div>
        {booking.reason ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">หมายเหตุ</dt>
            <dd className="sm:col-span-2">{booking.reason}</dd>
          </div>
        ) : null}
      </dl>

      {canApprove ? (
        <MeetingApproveForm action={approveMeetingBooking.bind(null, id)} />
      ) : null}

      {canDelete ? (
        <div className="text-right">
          <MeetingBookingDeleteButton id={id} />
        </div>
      ) : null}
    </section>
  );
}
