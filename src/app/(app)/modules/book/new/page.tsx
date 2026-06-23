import { redirect } from "next/navigation";
import { BookComposeForm } from "@/components/book/book-compose-form";
import { createBookDocument } from "@/lib/book/actions";
import { canWriteBook } from "@/lib/book/permissions";
import {
  listActiveSchoolsForBook,
  listBookGroupsForSelect,
} from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";

export default async function BookNewPage() {
  const { user, perms, scope } = await requireBookScope();
  if (!canWriteBook(user, perms)) redirect("/modules/book/sent");

  const [schools, groups] = await Promise.all([
    listActiveSchoolsForBook(),
    listBookGroupsForSelect(),
  ]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <BookComposeForm
        action={createBookDocument}
        scope={scope}
        schools={schools}
        groups={groups}
        defaultSignDate={todayBangkokDateString()}
      />
    </section>
  );
}
