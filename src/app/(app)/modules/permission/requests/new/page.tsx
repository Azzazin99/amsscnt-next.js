import { redirect } from "next/navigation";
import { PermissionRequestForm } from "@/components/permission/permission-request-form";
import { createPermissionRequest } from "@/lib/permission/actions";
import { canWritePermissionRequest } from "@/lib/permission/permissions";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionRequestNewPage() {
  const { user, perms } = await requirePermissionScope();
  if (!canWritePermissionRequest(user, perms)) {
    redirect("/modules/permission/requests");
  }

  return (
    <PermissionRequestForm
      action={createPermissionRequest}
      cancelHref="/modules/permission/requests"
    />
  );
}
