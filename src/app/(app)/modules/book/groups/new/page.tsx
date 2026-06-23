import { redirect } from "next/navigation";
import { BookGroupForm } from "@/components/book/book-group-form";
import { createBookGroup } from "@/lib/book/groups/actions";
import { listSchoolsForBookGroupForm } from "@/lib/book/groups/queries";
import { canManageBookGroups } from "@/lib/book/permissions";
import { requireBookScope } from "@/lib/book/scope";

export default async function NewBookGroupPage() {
  const { user, perms } = await requireBookScope();
  if (!canManageBookGroups(user, perms)) redirect("/modules/book/inbox");

  const schools = await listSchoolsForBookGroupForm();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <BookGroupForm
        mode="create"
        title="เพิ่มกลุ่มหนังสือ"
        cancelHref="/modules/book/groups"
        action={createBookGroup}
        schools={schools}
      />
    </section>
  );
}
