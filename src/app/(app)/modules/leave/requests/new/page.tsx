import { redirect } from "next/navigation";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { createLeaveRequest } from "@/lib/leave/actions";
import { bangkokTodayIso } from "@/lib/book/dates";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import { loadLeaveFormContext } from "@/lib/leave/form-context";
import { canWriteLeaveRequest } from "@/lib/leave/permissions";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{
    group?: string;
  }>;
};

export default async function LeaveRequestNewPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireLeaveScope();
  if (!canWriteLeaveRequest(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const params = await searchParams;
  if (params.group === "sick" || params.group === "vacation") {
    redirect("/modules/leave/requests/new");
  }

  const todayIso = bangkokTodayIso();

  const [districtSettings, formContext] = await Promise.all([
    getDistrictSettingsRow(),
    loadLeaveFormContext({
      personId: user.personId,
      scope,
      asOfIso: todayIso,
      excludePersonIdForJob: user.personId,
    }),
  ]);

  const officeName = districtSettings?.officeName ?? user.officeName;

  return (
    <LeaveRequestForm
      action={createLeaveRequest}
      cancelHref="/modules/leave/requests"
      todayIso={todayIso}
      officeName={officeName}
      requester={
        formContext.requester ?? {
          displayName: user.personId,
          positionLabel: "—",
        }
      }
      approverOptions={formContext.approverOptions}
      jobPersonOptions={formContext.jobPersonOptions}
      statsAgoByType={formContext.statsAgoByType}
      relaxCollect={formContext.relaxCollect}
      relaxThisYear={formContext.relaxThisYear}
      lastLeaveByType={formContext.lastLeaveByType}
      quotaHints={formContext.quotaHints}
      personSex={formContext.personSex}
      personId={user.personId}
    />
  );
}
