import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { canManageMeetingSettings } from "@/lib/meeting/permissions";
import { listAllMeetingRooms } from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";

export default async function MeetingRoomsPage() {
  const { user } = await requireMeetingScope();
  if (!canManageMeetingSettings(user)) {
    redirect("/modules/meeting/bookings");
  }

  const rows = await listAllMeetingRooms();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">กำหนดห้องประชุม</h2>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อห้องประชุม</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5 font-mono">{row.roomCode}</td>
                <td className="px-3 py-2.5">{row.roomName}</td>
                <td className="px-3 py-2.5 text-center">
                  {row.active ? (
                    <span className="text-primary">เปิดใช้งาน</span>
                  ) : (
                    <span className="text-destructive">ปิดใช้งาน</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/modules/meeting/rooms/${row.id}/edit`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                    aria-label="แก้ไข"
                  >
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
