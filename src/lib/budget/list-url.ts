export function buildBudgetReceiveUrl(options: { page?: number; q?: string }) {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.q) params.set("q", options.q);
  const qs = params.toString();
  return qs ? `/modules/budget/receive?${qs}` : "/modules/budget/receive";
}

export function buildBudgetDisburseUrl(options: { page?: number; q?: string }) {
  const params = new URLSearchParams();
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.q) params.set("q", options.q);
  const qs = params.toString();
  return qs ? `/modules/budget/disburse?${qs}` : "/modules/budget/disburse";
}
