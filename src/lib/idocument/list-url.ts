type ListUrlParams = {
  page?: number;
  q?: string;
};

export function buildIdocumentListUrl(
  basePath: string,
  params: ListUrlParams,
): string {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.q) {
    search.set("q", params.q);
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
