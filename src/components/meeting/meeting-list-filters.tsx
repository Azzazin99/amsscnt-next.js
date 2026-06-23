"use client";

import { useRouter } from "next/navigation";
import type { MeetingRoomRow } from "@/lib/meeting/queries";
import { buildMeetingBookingsUrl } from "@/lib/meeting/list-url";

type MeetingListFiltersProps = {
  rooms: MeetingRoomRow[];
  roomCode: number | null;
};

const selectClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MeetingListFilters({
  rooms,
  roomCode,
}: MeetingListFiltersProps) {
  const router = useRouter();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const roomRaw = Number(fd.get("room"));
        router.push(
          buildMeetingBookingsUrl({
            roomCode:
              Number.isFinite(roomRaw) && roomRaw >= 1 ? roomRaw : null,
          }),
        );
      }}
    >
      <div className="space-y-1">
        <label htmlFor="room" className="text-sm font-medium">
          ห้องประชุม
        </label>
        <select
          id="room"
          name="room"
          defaultValue={roomCode ?? ""}
          className={selectClass}
        >
          <option value="">ทุกห้องประชุม</option>
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
        เลือก
      </button>
    </form>
  );
}
