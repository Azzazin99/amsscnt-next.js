export function buildUsersListUrl(input: {
  q?: string;
  status?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}
