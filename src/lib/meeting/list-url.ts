export function buildMeetingBookingsUrl(params: {
  page?: number;
  roomCode?: number | null;
}) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.roomCode) {
    search.set("room", String(params.roomCode));
  }
  const qs = search.toString();
  return qs ? `/modules/meeting/bookings?${qs}` : "/modules/meeting/bookings";
}

export function buildMeetingCalendarUrl(params: {
  date?: string;
  roomCode?: number | null;
}) {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.roomCode) search.set("room", String(params.roomCode));
  const qs = search.toString();
  return qs ? `/modules/meeting/calendar?${qs}` : "/modules/meeting/calendar";
}
