import { redirect } from "next/navigation";
import { PermissionOrgTravelReferenceTable } from "@/components/permission/permission-org-travel-reference-table";
import { PermissionRequestForm } from "@/components/permission/permission-request-form";
import { createPermissionRequest } from "@/lib/permission/actions";
import { listOrgTravelForPermissionReference } from "@/lib/permission/org-travel-reference-queries";
import { canWritePermissionRequest } from "@/lib/permission/permissions";
import { getActivePermissionYear } from "@/lib/permission/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionRequestNewPage() {
  const { user, perms, scope } = await requirePermissionScope();
  if (!canWritePermissionRequest(user, perms)) {
    redirect("/modules/permission/requests");
  }

  const [travelRows, activePermissionYear] = await Promise.all([
    listOrgTravelForPermissionReference(scope),
    getActivePermissionYear(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PermissionRequestForm
        action={createPermissionRequest}
        cancelHref="/modules/permission/requests"
      />
      <PermissionOrgTravelReferenceTable
        rows={travelRows}
        scope={scope}
        budgetYearLabel={
          activePermissionYear
            ? String(activePermissionYear.budgetYear)
            : null
        }
      />
    </div>
  );
}
