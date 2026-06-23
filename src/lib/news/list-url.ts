export function buildNewsArticlesUrl(params: {
  page?: number;
  q?: string;
  section?: number;
}): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  if (params.section) search.set("section", String(params.section));
  const qs = search.toString();
  return qs ? `/modules/news?${qs}` : "/modules/news";
}

export function buildNewsSectionsUrl(params: { page?: number }): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/modules/news/sections?${qs}` : "/modules/news/sections";
}
