import { AlertEmptyList } from "@/components/alert/alert-empty-list";
import { requireAlertScope } from "@/lib/alert/scope";

export default async function AlertListPage() {
  await requireAlertScope();

  return (
    <AlertEmptyList
      title="แจ้งเตือน"
      emptyMessage="ไม่มีข้อความแจ้งเตือน — รอเชื่อมระบบแจ้งเตือน"
      columns={["ลำดับ", "ข้อความแจ้งเตือน"]}
    />
  );
}
