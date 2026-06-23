import { notFound, redirect } from "next/navigation";
import { AchievementScoreForm } from "@/components/achievement/achievement-score-form";
import { updateAchievementScore } from "@/lib/achievement/actions";
import { canWriteAchievementScore } from "@/lib/achievement/permissions";
import { getAchievementScore, listSchoolsForAchievementPicker } from "@/lib/achievement/queries";
import { requireAchievementScope } from "@/lib/achievement/scope";

type Props = { params: Promise<{ id: string }> };

export default async function AchievementScoreEditPage({ params }: Props) {
  const { user, perms } = await requireAchievementScope();
  if (!canWriteAchievementScore(user, perms)) redirect("/modules/achievement/scores");

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const [record, schools] = await Promise.all([
    getAchievementScore(id),
    listSchoolsForAchievementPicker(),
  ]);
  if (!record) notFound();

  return (
    <AchievementScoreForm
      action={(formData) => updateAchievementScore(id, formData)}
      title="แก้ไขคะแนนผลสัมฤทธิ์"
      cancelHref="/modules/achievement/scores"
      schools={schools}
      defaultValues={{
        testType: record.testType,
        testClass: record.testClass,
        edYear: record.edYear,
        schoolCode: record.schoolCode,
        thai: record.thai,
        math: record.math,
        science: record.science,
        social: record.social,
        english: record.english,
        health: record.health,
        art: record.art,
        vocation: record.vocation,
      }}
    />
  );
}
