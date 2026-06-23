import { redirect } from "next/navigation";
import { AchievementScoreForm } from "@/components/achievement/achievement-score-form";
import { createAchievementScore } from "@/lib/achievement/actions";
import { canWriteAchievementScore } from "@/lib/achievement/permissions";
import { listSchoolsForAchievementPicker } from "@/lib/achievement/queries";
import { requireAchievementScope } from "@/lib/achievement/scope";

export default async function AchievementScoreNewPage() {
  const { user, perms } = await requireAchievementScope();
  if (!canWriteAchievementScore(user, perms)) redirect("/modules/achievement/scores");

  const schools = await listSchoolsForAchievementPicker();

  return (
    <AchievementScoreForm
      action={createAchievementScore}
      title="บันทึกคะแนนผลสัมฤทธิ์"
      cancelHref="/modules/achievement/scores"
      schools={schools}
    />
  );
}
