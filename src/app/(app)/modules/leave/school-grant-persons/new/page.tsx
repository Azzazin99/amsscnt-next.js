import { LeaveSchoolGrantForm } from "@/components/leave/leave-school-grant-form";
import { createSchoolGrantDeputy } from "@/lib/leave/actions";
import { listDeputyStaffForSchoolGrantPicker } from "@/lib/leave/school-grant-queries";

export default async function LeaveSchoolGrantNewPage() {
  const staffOptions = await listDeputyStaffForSchoolGrantPicker();

  return (
    <LeaveSchoolGrantForm
      action={createSchoolGrantDeputy}
      staffOptions={staffOptions}
      title="เพิ่มผู้อนุมัติ (รร.)"
      cancelHref="/modules/leave/school-grant-persons"
    />
  );
}
