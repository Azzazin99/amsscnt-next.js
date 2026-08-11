import { notFound, redirect } from "next/navigation";
import { PermissionGrantPersonForm } from "@/components/permission/permission-grant-person-form";
import { updatePermissionGrantPerson } from "@/lib/permission/actions";
import {
  getPermissionGrantPersonEdit,
  listPeopleForPermissionGrantPicker,
} from "@/lib/permission/grant-persons-queries";
import { canManagePermissionSettings } from "@/lib/permission/permissions";
import { requirePermissionScope } from "@/lib/permission/scope";

type PageProps = {
  params: Promise<{ personId: string }>;
};

export default async function PermissionGrantPersonEditPage({
  params,
}: PageProps) {
  const { user, perms } = await requirePermissionScope();
  if (!canManagePermissionSettings(user, perms)) {
    redirect("/modules/permission/requests");
  }

  const { personId } = await params;
  const row = await getPermissionGrantPersonEdit(personId);
  if (!row) notFound();

  const personOptions = await listPeopleForPermissionGrantPicker();
  const boundAction = updatePermissionGrantPerson.bind(null, personId);

  return (
    <PermissionGrantPersonForm
      action={boundAction}
      personLabel={row.displayName}
      positionLabel={row.positionLabel}
      schoolLabel={row.schoolName}
      cancelHref="/modules/permission/grant-persons"
      personOptions={personOptions}
      defaultValues={{
        groupPersonId: row.groupPersonId,
        grantPersonId: row.grantPersonId,
      }}
    />
  );
}
