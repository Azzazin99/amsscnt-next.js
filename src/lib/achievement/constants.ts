export const ACHIEVEMENT_TEST_TYPES = [
  { value: 1, label: "O-NET" },
  { value: 2, label: "NT" },
] as const;

export const ACHIEVEMENT_ONET_CLASSES = [
  { value: 6, label: "ประถมศึกษาปีที่ 6" },
  { value: 9, label: "มัธยมศึกษาปีที่ 3" },
  { value: 12, label: "มัธยมศึกษาปีที่ 6" },
] as const;

export function testTypeLabel(testType: number): string {
  return ACHIEVEMENT_TEST_TYPES.find((t) => t.value === testType)?.label ?? `#${testType}`;
}

export function testClassLabel(testClass: number): string {
  return (
    ACHIEVEMENT_ONET_CLASSES.find((t) => t.value === testClass)?.label ??
    `#${testClass}`
  );
}

export function computeScoreAvg(scores: {
  thai: number;
  math: number;
  science: number;
  social: number;
  english: number;
  health: number;
  art: number;
  vocation: number;
}): number {
  const values = [
    scores.thai,
    scores.math,
    scores.science,
    scores.social,
    scores.english,
    scores.health,
    scores.art,
    scores.vocation,
  ];
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
