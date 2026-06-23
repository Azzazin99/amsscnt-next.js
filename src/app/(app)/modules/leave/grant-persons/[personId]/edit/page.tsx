import { notFound, redirect } from "next/navigation";
import { LeaveGrantPersonForm } from "@/components/leave/leave-grant-person-form";
import { updateLeaveGrantPerson } from "@/lib/leave/actions";
import {
  getLeaveGrantPersonEdit,
  listDistrictPeopleForGrantPicker,
} from "@/lib/leave/grant-persons-queries";
import { canManageLeaveSettings } from "@/lib/leave/permissions";
import { requireLeaveScope } from "@/lib/leave/scope";

type PageProps = {
  params: Promise<{ personId: string }>;
};

export default async function LeaveGrantPersonEditPage({ params }: PageProps) {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const { personId } = await params;
  const row = await getLeaveGrantPersonEdit(personId);
  if (!row) notFound();

  const [groupDirectorOptions, deputyDirectorOptions, grantOptions] =
    await Promise.all([
      listDistrictPeopleForGrantPicker([3]),
      listDistrictPeopleForGrantPicker([2]),
      listDistrictPeopleForGrantPicker([1, 2]),
    ]);

  const boundAction = updateLeaveGrantPerson.bind(null, personId);

  return (
    <LeaveGrantPersonForm
      action={boundAction}
      personLabel={row.displayName}
      positionLabel={row.positionLabel}
      cancelHref="/modules/leave/grant-persons"
      groupDirectorOptions={groupDirectorOptions}
      deputyDirectorOptions={deputyDirectorOptions}
      grantOptions={grantOptions}
      defaultValues={{
        commentPersonId: row.commentPersonId,
        commentPerson2Id: row.commentPerson2Id,
        grantPersonId: row.grantPersonId,
      }}
    />
  );
}
