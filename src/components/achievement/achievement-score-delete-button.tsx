"use client";

import { deleteAchievementScore } from "@/lib/achievement/actions";

export function AchievementScoreDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบรายการคะแนนนี้?")) return;
    await deleteAchievementScore(id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-destructive hover:underline"
      aria-label="ลบ"
    >
      ลบ
    </button>
  );
}
