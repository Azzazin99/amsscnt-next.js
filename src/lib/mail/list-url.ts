export function buildMailInboxUrl(params: {
  page?: number;
  q?: string;
  ack?: string;
}) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  if (params.ack && params.ack !== "all") search.set("ack", params.ack);
  const qs = search.toString();
  return qs ? `/modules/mail/inbox?${qs}` : "/modules/mail/inbox";
}

export function buildMailSentUrl(params: { page?: number; q?: string }) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `/modules/mail/sent?${qs}` : "/modules/mail/sent";
}

export function buildMailGroupsUrl(params: { page?: number; q?: string }) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return qs ? `/modules/mail/groups?${qs}` : "/modules/mail/groups";
}
