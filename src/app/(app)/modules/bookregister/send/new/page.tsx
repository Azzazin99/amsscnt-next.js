import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SendForm,
  type SendFormDefaults,
} from "@/components/bookregister/send/send-form";
import { getSchoolOfficeNo } from "@/lib/bookregister/office-no/queries";
import { createDistrictSend } from "@/lib/bookregister/send/actions";
import {
  getDistrictOfficeName,
  getDistrictOfficeNo,
} from "@/lib/bookregister/send/queries";
import { listWorkgroupsForFilter } from "@/lib/bookregister/receive/queries";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";

export default async function NewDistrictSendPage() {
  const { user, perms, scope } = await requireBookregisterScope();

  if (!canWriteRegisters(user, perms, scope)) {
    redirect("/modules/bookregister/send");
  }

  const activeYear = await getActiveRegisterYear(scope);
  const sendEnabled = activeYear != null && activeYear.startSendNum > 0;
  if (!sendEnabled) {
    redirect("/modules/bookregister/send");
  }

  const isSchool = scope.kind === "school";

  const [workgroups, officeNo, officeName] = await Promise.all([
    isSchool ? Promise.resolve([]) : listWorkgroupsForFilter(),
    isSchool
      ? getSchoolOfficeNo(scope.schoolCode)
      : getDistrictOfficeNo(),
    isSchool
      ? Promise.resolve(scope.schoolName)
      : getDistrictOfficeName(),
  ]);

  const defaults: SendFormDefaults = {
    bookFrom: officeName,
  };

  const officeNoTrimmed = officeNo.trim();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {!officeNoTrimmed ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          ยังไม่ได้กำหนดเลขที่สำนักงาน —{" "}
          <Link
            href="/modules/bookregister/office-no"
            className="font-medium underline"
          >
            กำหนดเลขที่หนังสือ
          </Link>{" "}
          ก่อนลงทะเบียนส่ง
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          หลังบันทึกจะไปหน้าแก้ไขเพื่อแนบไฟล์ (ถ้ามี) · prefix เลขที่:{" "}
          <span className="font-medium text-foreground">{officeNoTrimmed}</span>
        </p>
      )}
      <SendForm
        title="ลงทะเบียนหนังสือส่ง"
        cancelHref="/modules/bookregister/send"
        workgroups={workgroups}
        defaultValues={defaults}
        variant={isSchool ? "school" : "district"}
        action={createDistrictSend}
        mode="create"
        officeNo={officeNoTrimmed || undefined}
        redirectToEditOnCreate
      />
    </section>
  );
}
