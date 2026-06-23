import { notFound, redirect } from "next/navigation";
import { MeetingRoomForm } from "@/components/meeting/meeting-room-form";
import { updateMeetingRoom } from "@/lib/meeting/actions";
import { canManageMeetingSettings } from "@/lib/meeting/permissions";
import { getMeetingRoom } from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";

type Props = { params: Promise<{ id: string }> };

export default async function MeetingRoomEditPage({ params }: Props) {
  const { user } = await requireMeetingScope();
  if (!canManageMeetingSettings(user)) {
    redirect("/modules/meeting/bookings");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getMeetingRoom(id);
  if (!row) notFound();

  return (
    <MeetingRoomForm
      action={updateMeetingRoom.bind(null, id)}
      cancelHref="/modules/meeting/rooms"
      roomCode={row.roomCode}
      defaultValues={{
        roomName: row.roomName,
        active: row.active,
      }}
    />
  );
}
