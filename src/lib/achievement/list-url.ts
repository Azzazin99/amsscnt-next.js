export function buildAchievementScoresUrl(input: {
  page?: number;
  q?: string;
  edYear?: number | null;
  testType?: number | null;
}): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.edYear) params.set("edYear", String(input.edYear));
  if (input.testType) params.set("testType", String(input.testType));
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs ? `/modules/achievement/scores?${qs}` : "/modules/achievement/scores";
}
