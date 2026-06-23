import { BookobecEmptyList } from "@/components/bookobec/bookobec-empty-list";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecSentPage() {
  await requireBookobecScope();

  return (
    <BookobecEmptyList
      title="รายการหนังสือส่ง สพฐ."
      emptyMessage="ยังไม่มีข้อมูล — รอเชื่อมระบบ สพฐ."
      columns={["เลขที่หนังสือ", "ลงวันที่", "เรื่อง", "ถึง", "สถานะ"]}
    />
  );
}
