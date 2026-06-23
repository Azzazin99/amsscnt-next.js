import { redirect } from "next/navigation";
import {
  ReceiveForm,
  type ReceiveFormDefaults,
} from "@/components/bookregister/receive/receive-form";
import { createDistrictReceive } from "@/lib/bookregister/receive/actions";
import {
  listSchoolsForSelect,
  listWorkgroupsForFilter,
} from "@/lib/bookregister/receive/queries";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";

export default async function NewDistrictReceivePage() {
  const { user, perms, scope } = await requireBookregisterScope();

  if (!canWriteRegisters(user, perms, scope)) {
    redirect("/modules/bookregister/receive");
  }

  const activeYear = await getActiveRegisterYear(scope);
  const receiveEnabled =
    activeYear != null && activeYear.startReceiveNum > 0;

  if (!receiveEnabled) {
    redirect("/modules/bookregister/receive");
  }

  const isSchool = scope.kind === "school";

  const [schools, workgroups] = await Promise.all([
    isSchool ? Promise.resolve([]) : listSchoolsForSelect(),
    isSchool ? Promise.resolve([]) : listWorkgroupsForFilter(),
  ]);

  const defaults: ReceiveFormDefaults = {
    comment: "เอกสารกระดาษ",
    ...(isSchool ? { bookTo: scope.schoolName } : {}),
  };

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="mb-4 text-sm text-muted-foreground">
        หลังบันทึกจะไปหน้าแก้ไขเพื่อแนบไฟล์ (ถ้ามี)
      </p>
      <ReceiveForm
        title="ลงทะเบียนหนังสือรับ"
        cancelHref="/modules/bookregister/receive"
        schools={schools}
        workgroups={workgroups}
        defaultValues={defaults}
        variant={isSchool ? "school" : "district"}
        suggestBookNoOnSchoolChange={!isSchool}
        redirectToEditOnCreate
        action={createDistrictReceive}
      />
    </section>
  );
}
