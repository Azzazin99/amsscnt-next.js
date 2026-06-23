import { BookobecEmptyList } from "@/components/bookobec/bookobec-empty-list";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecInboxPage() {
  await requireBookobecScope();

  return (
    <BookobecEmptyList
      title="รายการหนังสือรับ สพฐ."
      emptyMessage="ยังไม่มีข้อมูล — รอเชื่อมระบบ สพฐ."
      columns={["เลขที่หนังสือ", "ลงวันที่", "เรื่อง", "จาก", "สถานะ"]}
    />
  );
}
