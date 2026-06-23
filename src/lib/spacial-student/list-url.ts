export function buildSpacialStudentListUrl(input: {
  page?: number;
  q?: string;
  schoolCode?: string | null;
  disableType?: number | null;
}): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.schoolCode) params.set("schoolCode", input.schoolCode);
  if (input.disableType) params.set("disableType", String(input.disableType));
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs
    ? `/modules/spacial_student/students?${qs}`
    : "/modules/spacial_student/students";
}
