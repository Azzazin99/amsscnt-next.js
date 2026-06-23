import { redirect } from "next/navigation";

export default function MeetingHomePage() {
  redirect("/modules/meeting/bookings");
}
