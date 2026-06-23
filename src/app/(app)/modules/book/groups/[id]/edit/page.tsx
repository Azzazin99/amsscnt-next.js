import { notFound, redirect } from "next/navigation";
import { BookGroupForm } from "@/components/book/book-group-form";
import {
  deleteBookGroup,
  updateBookGroup,
} from "@/lib/book/groups/actions";
import {
  getBookGroupById,
  listBookGroupMemberIds,
  listSchoolsForBookGroupForm,
} from "@/lib/book/groups/queries";
import { canManageBookGroups } from "@/lib/book/permissions";
import { requireBookScope } from "@/lib/book/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBookGroupPage({ params }: Props) {
  const { user, perms } = await requireBookScope();
  if (!canManageBookGroups(user, perms)) redirect("/modules/book/inbox");

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) notFound();

  const [group, memberIds, schools] = await Promise.all([
    getBookGroupById(id),
    listBookGroupMemberIds(id),
    listSchoolsForBookGroupForm(),
  ]);

  if (!group) notFound();

  const boundUpdate = updateBookGroup.bind(null, id);
  const boundDelete = deleteBookGroup.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <BookGroupForm
        mode="edit"
        title="แก้ไขกลุ่มหนังสือ"
        cancelHref="/modules/book/groups"
        action={boundUpdate}
        deleteAction={boundDelete}
        schools={schools}
        defaultValues={{
          name: group.name,
          sortOrder: group.sortOrder,
          schoolIds: memberIds,
        }}
      />
    </section>
  );
}
