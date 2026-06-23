import { RegisterReportPicker } from "@/components/bookregister/reports/register-report-picker";
import { requireBookregisterScope } from "@/lib/bookregister/scope";
import {
  getActiveRegisterYear,
  listRegisterYears,
} from "@/lib/bookregister/years/queries";

export default async function BookregisterReportsPage() {
  const { scope } = await requireBookregisterScope();

  const [years, activeYear] = await Promise.all([
    listRegisterYears(scope),
    getActiveRegisterYear(scope),
  ]);

  const yearValues = years.map((y) => y.year);
  const isSchool = scope.kind === "school";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          แบบพิมพ์ / รายงานทะเบียน
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          พิมพ์หรือส่งออก Excel ทะเบียนรับ ส่ง
          {isSchool ? "" : " และคำสั่ง"} ต่อปี — คอลัมน์ตามแบบระเบียบงานสารบรรณ
          พ.ศ. 2546
        </p>
      </div>

      {yearValues.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          ยังไม่มีปีทะเบียน — กรุณาแจ้งเจ้าหน้าที่ทะเบียน
        </p>
      ) : (
        <RegisterReportPicker
          years={yearValues}
          defaultYear={activeYear?.year ?? null}
          kinds={isSchool ? ["receive", "send"] : undefined}
        />
      )}
    </div>
  );
}
