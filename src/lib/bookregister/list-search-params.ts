export type ListSearchFilters = {
  q?: string;
  workgroupId?: number;
};

export type ParsedListSearch = {
  q: string;
  workgroupId?: number;
  page: number;
  filters: ListSearchFilters;
  baseParams: Record<string, string | undefined>;
};

export function parseListSearchParams(params: {
  page?: string;
  q?: string;
  workgroup?: string;
}): ParsedListSearch {
  const q = params.q?.trim() ?? "";
  const workgroupRaw = params.workgroup ? Number(params.workgroup) : undefined;
  const workgroupId =
    workgroupRaw && Number.isFinite(workgroupRaw) ? workgroupRaw : undefined;

  const filters: ListSearchFilters = {
    q: q || undefined,
    workgroupId,
  };

  const baseParams: Record<string, string | undefined> = {
    q: q || undefined,
    workgroup: workgroupId ? String(workgroupId) : undefined,
  };

  return {
    q,
    workgroupId,
    page: 1,
    filters,
    baseParams,
  };
}

export function resolveListPage(
  parsed: ParsedListSearch,
  params: { page?: string },
  totalPages: number,
): number {
  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  return page;
}

export function buildListSearchUrl(
  basePath: string,
  input: {
    q: string;
    workgroupId?: number;
    page?: number;
  },
): string {
  const q = input.q.trim();
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (input.workgroupId) {
    params.set("workgroup", String(input.workgroupId));
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function listSearchUrlMatches(
  basePath: string,
  pathname: string,
  searchParams: URLSearchParams,
  input: {
    q: string;
    workgroupId?: number;
    page?: number;
  },
): boolean {
  const target = buildListSearchUrl(basePath, input);
  const currentQs = searchParams.toString();
  const current = currentQs ? `${pathname}?${currentQs}` : pathname;
  return target === current;
}
