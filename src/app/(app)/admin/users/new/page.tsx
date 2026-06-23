import { UserForm } from "@/components/core/user-form";
import { createUser } from "@/lib/core/users/actions";
import { listSchoolsForUserSelect } from "@/lib/core/users/queries";

export default async function NewUserPage() {
  const schools = await listSchoolsForUserSelect();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <UserForm mode="create" title="เพิ่มผู้ใช้" cancelHref="/admin/users" schools={schools} action={createUser} />
    </section>
  );
}
