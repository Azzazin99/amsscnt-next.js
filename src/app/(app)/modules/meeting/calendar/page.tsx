import Link from "next/link";
import { MeetingCalendarFilters } from "@/components/meeting/meeting-calendar-filters";
import {
  listActiveMeetingRooms,
  listMeetingBookingsByDate,
  parseMeetingCalendarParams,
} from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    date?: string;
    room?: string;
  }>;
};

function approveBadgeClass(approve: number | null): string {
  if (approve === 1) {
    return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200";
  }
  if (approve === 2) {
    return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
}

export default async function MeetingCalendarPage({ searchParams }: Props) {
  await requireMeetingScope();
  const params = await searchParams;
  const parsed = parseMeetingCalendarParams(params);
  const rooms = await listActiveMeetingRooms();
  const rows = await listMeetingBookingsByDate({
    date: parsed.date,
    roomCode: parsed.roomCode,
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ปฏิทินการใช้ห้องประชุม (รายวัน)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          แสดงรายการจองที่ครอบคลุมวันที่ {parsed.date}
          {parsed.roomCode
            ? ` · ห้อง ${rooms.find((r) => r.roomCode === parsed.roomCode)?.roomName ?? parsed.roomCode}`
            : " · ทุกห้อง"}
        </p>
      </div>

      <MeetingCalendarFilters
        rooms={rooms}
        date={parsed.date}
        roomCode={parsed.roomCode}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ห้อง</th>
              <th className="px-3 py-3 font-medium">เวลา</th>
              <th className="px-3 py-3 font-medium">วัตถุประสงค์</th>
              <th className="px-3 py-3 font-medium">ผู้จอง</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่มีการจองในวันนี้
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.roomName}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.startTimeLabel} – {row.finishTimeLabel}
                  </td>
                  <td className="px-3 py-2.5">{row.objective}</td>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        approveBadgeClass(row.approve),
                      )}
                    >
                      {row.approveStatusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/meeting/bookings/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
