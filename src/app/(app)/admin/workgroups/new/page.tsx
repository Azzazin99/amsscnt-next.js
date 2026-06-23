import { WorkgroupForm } from "@/components/core/workgroup-form";
import { createWorkgroup } from "@/lib/core/workgroups/actions";

export default function NewWorkgroupPage() {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <WorkgroupForm
        mode="create"
        title="เพิ่มกลุ่มงาน"
        cancelHref="/admin/workgroups"
        action={createWorkgroup}
        defaultValues={{ sortOrder: 0, active: true }}
      />
    </section>
  );
}
