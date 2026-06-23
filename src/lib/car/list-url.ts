export function buildCarRequestsUrl(input: {
  page?: number;
  q?: string;
  grant?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.grant && input.grant !== "all") params.set("grant", input.grant);
  const qs = params.toString();
  return qs ? `/modules/car/requests?${qs}` : "/modules/car/requests";
}
