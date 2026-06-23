export function buildCabinetListUrl(params: {
  page?: number;
  q?: string;
}): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `/modules/cabinet?${qs}` : "/modules/cabinet";
}
