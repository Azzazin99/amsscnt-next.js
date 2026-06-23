export function buildModuleAdminsListUrl(input: {
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs ? `/admin/module-admins?${qs}` : "/admin/module-admins";
}
