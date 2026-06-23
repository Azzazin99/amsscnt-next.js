import { ModuleAdminForm } from "@/components/core/module-admin-form";
import { createModuleAdmin } from "@/lib/core/module-admins/actions";
import { listUsersForModuleAdminPicker } from "@/lib/core/module-admins/queries";
import { listModulesForSelect } from "@/lib/core/modules/queries";

export default async function NewModuleAdminPage() {
  const [users, modules] = await Promise.all([
    listUsersForModuleAdminPicker(),
    listModulesForSelect(),
  ]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <ModuleAdminForm action={createModuleAdmin} users={users} modules={modules} />
    </section>
  );
}
