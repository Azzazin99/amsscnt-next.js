export function buildPlanProjectsUrl(options: {
  page?: number;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.q) params.set("q", options.q);
  const qs = params.toString();
  return qs ? `/modules/plan/projects?${qs}` : "/modules/plan/projects";
}

export function buildPlanActivitiesUrl(options: {
  page?: number;
  q?: string;
  proj?: string;
}) {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.q) params.set("q", options.q);
  if (options.proj) params.set("proj", options.proj);
  const qs = params.toString();
  return qs ? `/modules/plan/activities?${qs}` : "/modules/plan/activities";
}
