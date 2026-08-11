import { ModuleManualPlaceholder } from "@/components/modules/module-manual-placeholder";
import { requireBookregisterScope } from "@/lib/bookregister/scope";

export default async function BookregisterManualPage() {
  await requireBookregisterScope();

  return (
    <ModuleManualPlaceholder moduleName="ทะเบียนหนังสือราชการ" />
  );
}
