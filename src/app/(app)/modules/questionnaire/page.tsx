import { QuestionnaireEmptyList } from "@/components/questionnaire/questionnaire-empty-list";
import { requireQuestionnaireScope } from "@/lib/questionnaire/scope";

export default async function QuestionnaireListPage() {
  await requireQuestionnaireScope();

  return (
    <QuestionnaireEmptyList
      title="แบบสอบถาม"
      emptyMessage="ยังไม่มีข้อมูล — รอเชื่อมระบบแบบสอบถาม"
      columns={[
        "ชื่อแบบสอบถาม",
        "วันที่เปิด",
        "วันที่ปิด",
        "กลุ่มเป้าหมาย",
        "สถานะ",
      ]}
    />
  );
}
