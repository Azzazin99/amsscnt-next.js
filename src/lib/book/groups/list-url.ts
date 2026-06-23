export function buildBookGroupsListUrl(input: {
  page?: number;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  const qs = params.toString();
  return qs ? `/modules/book/groups?${qs}` : "/modules/book/groups";
}
