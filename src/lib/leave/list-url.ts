export function buildLeaveRequestsUrl(input: {
  page?: number;
  q?: string;
  leaveType?: number | null;
  grant?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.leaveType) params.set("leaveType", String(input.leaveType));
  if (input.grant && input.grant !== "all") params.set("grant", input.grant);
  const qs = params.toString();
  return qs ? `/modules/leave/requests?${qs}` : "/modules/leave/requests";
}
