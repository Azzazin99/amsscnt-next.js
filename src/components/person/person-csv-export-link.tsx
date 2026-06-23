"use client";

import { Download } from "lucide-react";
import { buildPersonListUrl } from "@/lib/person/list-url";

type PersonCsvExportLinkProps = {
  q: string;
  status: string;
  org: string;
  schoolId: number | null;
  workgroupId: number | null;
};

export function PersonCsvExportLink(props: PersonCsvExportLinkProps) {
  const params = new URLSearchParams();
  if (props.q) params.set("q", props.q);
  if (props.status && props.status !== "all") params.set("status", props.status);
  if (props.org && props.org !== "all") params.set("org", props.org);
  if (props.schoolId) params.set("schoolId", String(props.schoolId));
  if (props.workgroupId) params.set("workgroupId", String(props.workgroupId));

  const qs = params.toString();
  const href = qs ? `/api/person/export?${qs}` : "/api/person/export";

  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted"
      download
    >
      <Download className="size-4" aria-hidden />
      ส่งออก CSV
    </a>
  );
}
