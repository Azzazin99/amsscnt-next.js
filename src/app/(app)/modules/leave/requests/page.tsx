import { LeaveRegisterActions } from "@/components/leave/leave-register-actions";
import { LeaveRegisterHeader } from "@/components/leave/leave-register-header";
import { LeaveRegisterTable } from "@/components/leave/leave-register-table";
import { getLeaveRequesterProfile } from "@/lib/leave/form-context";
import { canWriteLeaveRequest } from "@/lib/leave/permissions";
import {
  PAGE_SIZE,
  countOwnLeaveRequests,
  listOwnLeaveRequestsPage,
  parseOwnLeaveRegisterParams,
  resolveLeaveListPage,
} from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function LaRequestsPage({ searchParams }: Props) {
  const { user, perms } = await requireLeaveScope();
  const params = await searchParams;
  const parsed = parseOwnLeaveRegisterParams(params);

  const total = await countOwnLeaveRequests(user.personId);
  const page = await resolveLeaveListPage(total, parsed.page);
  const rows = await listOwnLeaveRequestsPage({
    viewerPersonId: user.personId,
    page,
  });

  const requester = await getLeaveRequesterProfile(user.personId);
  const displayName = requester?.displayName ?? user.personId;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = canWriteLeaveRequest(user, perms);

  return (
    <section className="space-y-4">
      <LeaveRegisterHeader
        displayName={displayName}
        page={page}
        totalPages={totalPages}
      />
      <LeaveRegisterActions canWrite={canWrite} />
      <LeaveRegisterTable rows={rows} viewerPersonId={user.personId} />
    </section>
  );
}
