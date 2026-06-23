import "server-only";

import { unstable_cache } from "next/cache";
import type { RegisterReportKind } from "@/lib/bookregister/reports/columns";
import {
  listCommandReportRows,
  listReceiveReportRows,
  listSendReportRows,
  type CommandReportRow,
  type ReceiveReportRow,
  type SendReportRow,
} from "@/lib/bookregister/reports/queries";
import type { BookregisterScope } from "@/lib/bookregister/scope";

export const BOOKREGISTER_REPORTS_CACHE_TAG = "bookregister-reports";

type ReportScopeKey =
  | { kind: "district" }
  | { kind: "school"; schoolId: number };

function toScopeKey(scope: BookregisterScope): ReportScopeKey {
  return scope.kind === "district"
    ? { kind: "district" }
    : { kind: "school", schoolId: scope.schoolId };
}

function toBookregisterScope(key: ReportScopeKey): BookregisterScope {
  if (key.kind === "district") {
    return { kind: "district", schoolId: null };
  }
  return {
    kind: "school",
    schoolId: key.schoolId,
    schoolCode: "",
    schoolName: "",
  };
}

const cachedReceiveReportRows = unstable_cache(
  async (
    year: number,
    scopeKind: "district" | "school",
    schoolId: number | null,
    canViewSecret: boolean,
  ): Promise<ReceiveReportRow[]> => {
    const scope = toBookregisterScope(
      scopeKind === "district"
        ? { kind: "district" }
        : { kind: "school", schoolId: schoolId! },
    );
    return listReceiveReportRows(scope, year, { canViewSecret });
  },
  ["bookregister-report-receive"],
  { tags: [BOOKREGISTER_REPORTS_CACHE_TAG] },
);

const cachedSendReportRows = unstable_cache(
  async (
    year: number,
    scopeKind: "district" | "school",
    schoolId: number | null,
    canViewSecret: boolean,
  ): Promise<SendReportRow[]> => {
    const scope = toBookregisterScope(
      scopeKind === "district"
        ? { kind: "district" }
        : { kind: "school", schoolId: schoolId! },
    );
    return listSendReportRows(scope, year, { canViewSecret });
  },
  ["bookregister-report-send"],
  { tags: [BOOKREGISTER_REPORTS_CACHE_TAG] },
);

const cachedCommandReportRows = unstable_cache(
  async (year: number): Promise<CommandReportRow[]> => {
    return listCommandReportRows(year);
  },
  ["bookregister-report-command"],
  { tags: [BOOKREGISTER_REPORTS_CACHE_TAG] },
);

export async function getCachedReportRows(
  kind: RegisterReportKind,
  scope: BookregisterScope,
  year: number,
  canViewSecret: boolean,
): Promise<ReceiveReportRow[] | SendReportRow[] | CommandReportRow[]> {
  const scopeKey = toScopeKey(scope);
  const scopeKind = scopeKey.kind;
  const schoolId = scopeKey.kind === "school" ? scopeKey.schoolId : null;

  if (kind === "receive") {
    return cachedReceiveReportRows(year, scopeKind, schoolId, canViewSecret);
  }
  if (kind === "send") {
    return cachedSendReportRows(year, scopeKind, schoolId, canViewSecret);
  }
  return cachedCommandReportRows(year);
}
