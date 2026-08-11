import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookPermissionForm } from "@/components/book/permission-form";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { createBookPermission } from "@/lib/book/permissions/actions";
import { listDistrictStaffForBookPicker } from "@/lib/book/permissions/queries";

export default async function NewBookPermissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    redirect("/modules/book");
  }

  const staffOptions = await listDistrictStaffForBookPicker();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {staffOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ไม่มีบุคลากรเขตที่มีบัญชีผู้ใช้เหลือให้เพิ่ม — ต้องมี user ในระบบก่อน
        </p>
      ) : (
        <BookPermissionForm
          title="เพิ่มเจ้าหน้าที่"
          cancelHref="/modules/book/permissions"
          staffOptions={staffOptions}
          action={createBookPermission}
        />
      )}
    </section>
  );
}
