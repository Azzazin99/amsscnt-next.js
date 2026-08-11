import { LeaveManual } from "@/components/leave/leave-manual";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LeaveManualPage() {
  await requireLeaveScope();

  return <LeaveManual />;
}
