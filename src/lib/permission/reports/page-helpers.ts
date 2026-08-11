import "server-only";

import { getDistrictOfficeName } from "@/lib/bookregister/send/queries";
import type { PermissionScope } from "@/lib/permission/scope";

export async function getPermissionReportOfficeName(
  scope: PermissionScope,
): Promise<string> {
  if (scope.kind === "school") return scope.schoolName;
  return (await getDistrictOfficeName()) || "สำนักงานเขตพื้นที่การศึกษา";
}
