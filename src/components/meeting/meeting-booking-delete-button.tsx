"use client";

import { deleteMeetingBooking } from "@/lib/meeting/actions";

type MeetingBookingDeleteButtonProps = {
  id: number;
};

export function MeetingBookingDeleteButton({
  id,
}: MeetingBookingDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบรายการจองนี้?")) return;
    await deleteMeetingBooking(id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-destructive hover:underline"
    >
      ลบ
    </button>
  );
}
