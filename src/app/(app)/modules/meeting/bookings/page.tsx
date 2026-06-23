import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { MeetingListFilters } from "@/components/meeting/meeting-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildMeetingBookingsUrl } from "@/lib/meeting/list-url";
import { canBookMeeting } from "@/lib/meeting/permissions";
import {
  PAGE_SIZE,
  countMeetingBookings,
  listActiveMeetingRooms,
  listMeetingBookingsPage,
  parseMeetingListParams,
  resolveMeetingListPage,
} from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
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

export default async function MeetingBookingsPage({ searchParams }: Props) {
  const { user, perms } = await requireMeetingScope();
  const params = await searchParams;
  const parsed = parseMeetingListParams(params);
  const rooms = await listActiveMeetingRooms();

  const total = await countMeetingBookings(parsed.roomCode);
  const page = await resolveMeetingListPage(total, parsed.page);
  const rows = await listMeetingBookingsPage({
    page,
    roomCode: parsed.roomCode,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = canBookMeeting(user, perms);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">ทะเบียนจองห้องประชุม</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/meeting/bookings/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            จองห้องประชุม
          </Link>
        ) : null}
      </div>

      <MeetingListFilters rooms={rooms} roomCode={parsed.roomCode} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันประชุม</th>
              <th className="px-3 py-3 font-medium">เวลา</th>
              <th className="px-3 py-3 font-medium">ห้อง</th>
              <th className="px-3 py-3 font-medium">วัตถุประสงค์</th>
              <th className="px-3 py-3 text-center font-medium">จำนวนคน</th>
              <th className="px-3 py-3 font-medium">ผู้จอง</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบรายการจอง
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.bookDate}
                    {row.bookDateEnd !== row.bookDate ? (
                      <>
                        <br />
                        <span className="text-muted-foreground">
                          ถึง {row.bookDateEnd}
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.startTimeLabel} – {row.finishTimeLabel}
                  </td>
                  <td className="px-3 py-2.5">{row.roomName}</td>
                  <td className="px-3 py-2.5">{row.objective}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.personNum ?? "—"}
                  </td>
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

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildMeetingBookingsUrl({
            page: p,
            roomCode: parsed.roomCode,
          })
        }
      />
    </section>
  );
}
