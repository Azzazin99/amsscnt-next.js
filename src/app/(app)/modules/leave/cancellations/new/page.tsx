import { redirect } from "next/navigation";
import { LeaveCancellationForm } from "@/components/leave/leave-cancellation-form";
import { createLeaveCancellation } from "@/lib/leave/actions";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import { listLeaveApproverOptions } from "@/lib/leave/form-context";
import { canWriteLeaveRequest } from "@/lib/leave/permissions";
import { listEligibleLeaveRequestsForCancellation } from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LeaveCancellationNewPage() {
  const { user, perms } = await requireLeaveScope();
  if (!canWriteLeaveRequest(user, perms)) {
    redirect("/modules/leave/cancellations");
  }

  const [districtSettings, eligibleRequests, approverOptions] =
    await Promise.all([
      getDistrictSettingsRow(),
      listEligibleLeaveRequestsForCancellation(user.personId),
      listLeaveApproverOptions(),
    ]);

  const officeName = districtSettings?.officeName ?? user.officeName;

  return (
    <LeaveCancellationForm
      action={createLeaveCancellation}
      cancelHref="/modules/leave/cancellations"
      officeName={officeName}
      eligibleRequests={eligibleRequests}
      approverOptions={approverOptions}
    />
  );
}
