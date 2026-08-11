import { notFound, redirect } from "next/navigation";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { updateLeaveRequest } from "@/lib/leave/actions";
import { bangkokTodayIso } from "@/lib/book/dates";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import { loadLeaveFormContext } from "@/lib/leave/form-context";
import { canWriteLeaveRequest } from "@/lib/leave/permissions";
import {
  canMutateOwnLeaveRequest,
  getLeaveRequest,
  listLeaveRequestFiles,
} from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";
import { isLeaveTypeId } from "@/lib/leave/regulation/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeaveRequestEditPage({ params }: Props) {
  const { user, perms, scope } = await requireLeaveScope();
  if (!canWriteLeaveRequest(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const request = await getLeaveRequest(id);
  if (!request || !isLeaveTypeId(request.leaveType)) notFound();
  if (!canMutateOwnLeaveRequest(request, user.personId)) {
    redirect(`/modules/leave/requests/${id}`);
  }

  const todayIso = bangkokTodayIso();
  const asOfIso = request.leaveStart || todayIso;

  const [districtSettings, formContext, files] = await Promise.all([
    getDistrictSettingsRow(),
    loadLeaveFormContext({
      personId: user.personId,
      scope,
      asOfIso,
      excludePersonIdForJob: user.personId,
    }),
    listLeaveRequestFiles(id),
  ]);

  const officeName = districtSettings?.officeName ?? user.officeName;
  const existingAttachmentName =
    files[0]?.fileDes ?? files[0]?.fileName ?? null;

  const updateAction = updateLeaveRequest.bind(null, id);

  return (
    <LeaveRequestForm
      action={updateAction}
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
      initialValues={{
        leaveType: request.leaveType,
        writeAt: request.writeAt,
        because: request.because ?? "",
        leaveStart: request.leaveStart,
        leaveFinish: request.leaveFinish,
        halfDayPeriod: request.halfDayPeriod,
        contact: request.contact,
        contactTel: request.contactTel,
        noComment: request.noComment,
        grantPersonSelected: request.grantPersonSelected,
        jobPersonId: request.jobPersonId,
        documentName: request.documentName,
      }}
      submitLabel="บันทึกการแก้ไข"
      formTitle="แก้ไขคำขอลา"
      existingAttachmentName={existingAttachmentName}
    />
  );
}
