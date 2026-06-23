export function buildPersonListUrl(input: {
  page?: number;
  q?: string;
  status?: string;
  org?: string;
  schoolId?: number | null;
  workgroupId?: number | null;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.org && input.org !== "all") params.set("org", input.org);
  if (input.schoolId) params.set("schoolId", String(input.schoolId));
  if (input.workgroupId) params.set("workgroupId", String(input.workgroupId));
  const qs = params.toString();
  return qs ? `/modules/person/staff?${qs}` : "/modules/person/staff";
}
