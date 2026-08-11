import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SarabanForm } from "@/components/book/saraban-form";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { updateSarabanPermission } from "@/lib/book/permissions/actions";
import { getBookPermission, listDistrictStaffForBookPicker, listWorkgroupsForPicker } from "@/lib/book/permissions/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSarabanPermissionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    redirect("/modules/book");
  }

  const { id } = await params;
  const permissionId = Number(id);

  if (isNaN(permissionId)) notFound();

  const permission = await getBookPermission(permissionId);
  if (!permission) notFound();

  const [staffOptions, workgroupOptions] = await Promise.all([
    listDistrictStaffForBookPicker(permission.userId),
    listWorkgroupsForPicker()
  ]);

  const updateAction = updateSarabanPermission.bind(null, permission.id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SarabanForm
        cancelHref="/modules/book/saraban-permissions"
        staffOptions={staffOptions}
        workgroupOptions={workgroupOptions}
        action={updateAction}
        defaultValues={{
          userId: permission.userId,
          p1: permission.p1,
          p2: permission.p2,
        }}
      />
    </section>
  );
}
