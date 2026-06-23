import { ModuleManualPlaceholder } from "@/components/modules/module-manual-placeholder";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LeaveManualPage() {
  await requireLeaveScope();

  return <ModuleManualPlaceholder moduleName="ระบบการลา" />;
}
