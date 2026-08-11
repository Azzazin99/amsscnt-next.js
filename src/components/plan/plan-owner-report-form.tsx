import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PlanOwnerReportFormProps = {
  action: (formData: FormData) => Promise<void>;
  evalActivity: string;
  evalResult: string;
  evalObstacle: string;
};

export function PlanOwnerReportForm({
  action,
  evalActivity,
  evalResult,
  evalObstacle,
}: PlanOwnerReportFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-6">
      <div className="space-y-1">
        <label htmlFor="evalActivity" className="text-sm font-medium">
          วิธีการดำเนินงาน
        </label>
        <textarea
          id="evalActivity"
          name="evalActivity"
          rows={6}
          defaultValue={evalActivity}
          className={textareaClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="evalResult" className="text-sm font-medium">
          ผลการดำเนินงาน
        </label>
        <textarea
          id="evalResult"
          name="evalResult"
          rows={6}
          defaultValue={evalResult}
          className={textareaClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="evalObstacle" className="text-sm font-medium">
          ข้อค้นพบหรือข้อเสนอแนะ
        </label>
        <textarea
          id="evalObstacle"
          name="evalObstacle"
          rows={6}
          defaultValue={evalObstacle}
          className={textareaClass}
        />
      </div>
      <Button type="submit" className="min-h-11">
        บันทึกรายงาน
      </Button>
    </form>
  );
}
