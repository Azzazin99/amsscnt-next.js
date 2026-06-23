import { notFound } from "next/navigation";
import { UserForm } from "@/components/core/user-form";
import { updateUser } from "@/lib/core/users/actions";
import { getUserById, listSchoolsForUserSelect } from "@/lib/core/users/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isFinite(id) || id < 1) notFound();

  const [user, schools] = await Promise.all([getUserById(id), listSchoolsForUserSelect()]);
  if (!user) notFound();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <UserForm
        mode="edit"
        title="แก้ไขผู้ใช้"
        cancelHref="/admin/users"
        schools={schools}
        action={updateUser.bind(null, id)}
        defaultValues={{
          username: user.username,
          personId: user.personId,
          name: user.name,
          email: user.email,
          organizationType: user.organizationType,
          schoolId: user.schoolId,
          isAdmin: user.isAdmin,
          status: user.status,
        }}
      />
    </section>
  );
}
