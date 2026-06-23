import { ModuleManualPlaceholder } from "@/components/modules/module-manual-placeholder";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecManualPage() {
  await requireBookobecScope();

  return (
    <ModuleManualPlaceholder moduleName="รับส่งหนังสือราชการ สพฐ." />
  );
}
