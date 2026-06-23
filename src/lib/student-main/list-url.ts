export function buildStudentListUrl(input: {
  page?: number;
  q?: string;
  edYear?: number | null;
  schoolCode?: string | null;
  classLevel?: number | null;
}): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.edYear) params.set("edYear", String(input.edYear));
  if (input.schoolCode) params.set("schoolCode", input.schoolCode);
  if (input.classLevel) params.set("classLevel", String(input.classLevel));
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs
    ? `/modules/student_main/students?${qs}`
    : "/modules/student_main/students";
}
