import { DistrictSettingsForm } from "@/components/core/district-settings-form";
import { formatThaiDate } from "@/lib/format/thai-date";
import { updateDistrictSettings } from "@/lib/core/district-settings/actions";
import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";

const DEFAULT_OFFICE_NAME =
  process.env.AMSS_DISTRICT_NAME ??
  "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท";
const DEFAULT_OFFICE_CODE = process.env.AMSS_OFFICE_CODE ?? "1701";

export default async function DistrictSettingsPage() {
  const row = await getDistrictSettingsRow();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ตั้งค่าหน่วยงานเขต
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เทียบเมนูจัดการระบบ → ชื่อหน่วยงานในระบบเดิม (
          <code className="text-xs">system_office_name</code>)
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <DistrictSettingsForm
          action={updateDistrictSettings}
          defaultOfficeName={row?.officeName ?? DEFAULT_OFFICE_NAME}
          defaultOfficeCode={row?.officeCode ?? DEFAULT_OFFICE_CODE}
        />
      </div>

      {row ? (
        <p className="text-sm text-muted-foreground">
          แก้ไขล่าสุด: {formatThaiDate(row.updatedAt) || "—"}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          ยังไม่มีข้อมูลในฐานข้อมูล — บันทึกครั้งแรกเพื่อสร้างรายการ
        </p>
      )}
    </section>
  );
}
