import { PermissionRegisterHeader } from "@/components/permission/permission-register-header";
import { PermissionRegisterTable } from "@/components/permission/permission-register-table";
import { canWritePermissionRequest } from "@/lib/permission/permissions";
import {
  PAGE_SIZE,
  countOwnPermissionRequests,
  getPermissionRequesterDisplayName,
  listOwnPermissionRequestsPage,
  parseOwnPermissionRegisterParams,
  resolvePermissionListPage,
} from "@/lib/permission/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function PermissionRequestsPage({ searchParams }: Props) {
  const { user, perms } = await requirePermissionScope();
  const params = await searchParams;
  const parsed = parseOwnPermissionRegisterParams(params);

  const total = await countOwnPermissionRequests(user.personId);
  const page = await resolvePermissionListPage(total, parsed.page);
  const rows = await listOwnPermissionRequestsPage({
    personId: user.personId,
    page,
  });

  const displayName = await getPermissionRequesterDisplayName(user.personId);
  const canWrite = canWritePermissionRequest(user, perms);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <PermissionRegisterHeader
        displayName={displayName}
        page={page}
        totalPages={totalPages}
        canWrite={canWrite}
      />
      <PermissionRegisterTable rows={rows} />
    </section>
  );
}
