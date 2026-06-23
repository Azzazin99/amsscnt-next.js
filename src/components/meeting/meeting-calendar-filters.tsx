"use client";

import { useRouter } from "next/navigation";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import type { MeetingRoomRow } from "@/lib/meeting/queries";
import { buildMeetingCalendarUrl } from "@/lib/meeting/list-url";

type MeetingCalendarFiltersProps = {
  rooms: MeetingRoomRow[];
  date: string;
  roomCode: number | null;
};

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MeetingCalendarFilters({
  rooms,
  date,
  roomCode,
}: MeetingCalendarFiltersProps) {
  const router = useRouter();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const dateVal = String(fd.get("date") ?? "").trim();
        const roomRaw = Number(fd.get("room"));
        router.push(
          buildMeetingCalendarUrl({
            date: dateVal || undefined,
            roomCode:
              Number.isFinite(roomRaw) && roomRaw >= 1 ? roomRaw : null,
          }),
        );
      }}
    >
      <div className="space-y-1">
        <label htmlFor="date" className="text-sm font-medium">
          วันที่
        </label>
        <ThaiDatePicker id="date" name="date" defaultValue={date} required />
      </div>
      <div className="space-y-1">
        <label htmlFor="room" className="text-sm font-medium">
          ห้องประชุม
        </label>
        <select
          id="room"
          name="room"
          defaultValue={roomCode ?? ""}
          className={inputClass}
        >
          <option value="">ทุกห้อง</option>
          {rooms.map((room) => (
            <option key={room.roomCode} value={room.roomCode}>
              {room.roomName}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
      >
        แสดง
      </button>
    </form>
  );
}
