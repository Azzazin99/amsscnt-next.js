import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SarabanForm } from "@/components/book/saraban-form";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { saveSarabanPermission } from "@/lib/book/permissions/actions";
import { listDistrictStaffForBookPicker, listWorkgroupsForPicker } from "@/lib/book/permissions/queries";

export default async function NewSarabanPermissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    redirect("/modules/book");
  }

  const [staffOptions, workgroupOptions] = await Promise.all([
    listDistrictStaffForBookPicker(),
    listWorkgroupsForPicker()
  ]);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {staffOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ไม่มีบุคลากรเขตที่มีบัญชีผู้ใช้เหลือให้เพิ่ม — ต้องมี user ในระบบก่อน
        </p>
      ) : (
        <SarabanForm
          cancelHref="/modules/book/saraban-permissions"
          staffOptions={staffOptions}
          workgroupOptions={workgroupOptions}
          action={saveSarabanPermission}
        />
      )}
    </section>
  );
}
