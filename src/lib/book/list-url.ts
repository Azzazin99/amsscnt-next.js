export function buildBookInboxUrl(input: {
  page?: number;
  q?: string;
  ack?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.ack && input.ack !== "all") params.set("ack", input.ack);
  const qs = params.toString();
  return qs ? `/modules/book/inbox?${qs}` : "/modules/book/inbox";
}

export function buildBookInboxOverdueUrl(input: {
  page?: number;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  const qs = params.toString();
  return qs
    ? `/modules/book/inbox/overdue?${qs}`
    : "/modules/book/inbox/overdue";
}

export function buildBookInboxAgedUrl(input: {
  page?: number;
  q?: string;
  ack?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.ack && input.ack !== "all") params.set("ack", input.ack);
  const qs = params.toString();
  return qs ? `/modules/book/inbox/aged?${qs}` : "/modules/book/inbox/aged";
}

export function buildBookSentUrl(input: {
  page?: number;
  q?: string;
  type?: string;
}): string {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.type && input.type !== "all") params.set("type", input.type);
  const qs = params.toString();
  return qs ? `/modules/book/sent?${qs}` : "/modules/book/sent";
}
