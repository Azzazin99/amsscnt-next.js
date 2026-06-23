import { redirect } from "next/navigation";
import { MeetingBookingForm } from "@/components/meeting/meeting-booking-form";
import { createMeetingBooking } from "@/lib/meeting/actions";
import { canBookMeeting } from "@/lib/meeting/permissions";
import { listActiveMeetingRooms } from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";

type Props = {
  searchParams: Promise<{ room?: string }>;
};

export default async function MeetingBookingNewPage({ searchParams }: Props) {
  const { user, perms } = await requireMeetingScope();
  if (!canBookMeeting(user, perms)) {
    redirect("/modules/meeting/bookings");
  }

  const params = await searchParams;
  const roomRaw = Number(params.room);
  const defaultRoomCode =
    Number.isFinite(roomRaw) && roomRaw >= 1 ? roomRaw : null;
  const rooms = await listActiveMeetingRooms();

  return (
    <MeetingBookingForm
      action={createMeetingBooking}
      rooms={rooms}
      cancelHref="/modules/meeting/bookings"
      defaultRoomCode={defaultRoomCode}
    />
  );
}
