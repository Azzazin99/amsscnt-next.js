import { notFound, redirect } from "next/navigation";
import { LeaveSchoolGrantForm } from "@/components/leave/leave-school-grant-form";
import { updateSchoolGrantDeputy } from "@/lib/leave/actions";
import { canManageLeaveSettings } from "@/lib/leave/permissions";
import { requireLeaveScope } from "@/lib/leave/scope";
import {
  getSchoolGrantDeputy,
  listDeputyStaffForSchoolGrantPicker,
} from "@/lib/leave/school-grant-queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeaveSchoolGrantEditPage({ params }: PageProps) {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getSchoolGrantDeputy(id);
  if (!row) notFound();

  const staffOptions = await listDeputyStaffForSchoolGrantPicker(row.userId);
  const boundAction = updateSchoolGrantDeputy.bind(null, id);

  return (
    <LeaveSchoolGrantForm
      action={boundAction}
      staffOptions={staffOptions}
      title="แก้ไขผู้อนุมัติ (รร.)"
      cancelHref="/modules/leave/school-grant-persons"
      defaultUserId={row.userId}
    />
  );
}
