"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SchoolOption = { id: number; schoolCode: string; name: string };
type GroupOption = { id: number; name: string };

type Props = {
  registerSendId: number;
  action: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string; bookDocId?: number }>;
  schools: SchoolOption[];
  groups: GroupOption[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ForwardSendToBookSheet({
  registerSendId,
  action,
  schools,
  groups,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientMode, setRecipientMode] = useState("all_schools");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (!result.ok) {
        setError(result.message ?? "ส่งต่อไม่สำเร็จ");
        return;
      }
      setOpen(false);
      if (result.bookDocId) {
        router.push(`/modules/book/${result.bookDocId}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("ส่งต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="secondary">
            ส่งต่อโรงเรียน (ระบบรับส่ง)
          </Button>
        }
      />
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>ส่งต่อโรงเรียนผ่านระบบรับส่ง</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
          <input type="hidden" name="registerSendId" value={registerSendId} />
          <p className="text-sm text-muted-foreground">
            ระบบจะสร้างหนังสือในโมดูลรับส่ง พร้อมคัดลอกความเร็ว/ความลับจากทะเบียนส่ง
          </p>

          <div className="space-y-2">
            <label htmlFor="forwardRecipientMode" className="text-sm font-medium">
              ส่งถึง
            </label>
            <select
              id="forwardRecipientMode"
              name="recipientMode"
              value={recipientMode}
              onChange={(e) => setRecipientMode(e.target.value)}
              className={inputClass}
            >
              <option value="all_schools">โรงเรียนทั้งหมด</option>
              <option value="selected_schools">เลือกโรงเรียน</option>
              <option value="book_group">กลุ่มหนังสือ</option>
            </select>
          </div>

          {recipientMode === "book_group" ? (
            <div className="space-y-1">
              <label htmlFor="forwardGroupId" className="text-sm text-muted-foreground">
                กลุ่มหนังสือ
              </label>
              <select id="forwardGroupId" name="groupId" required className={inputClass}>
                <option value="">เลือกกลุ่ม</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {recipientMode === "selected_schools" ? (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2">
              {schools.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-2 text-sm"
                >
                  <input type="checkbox" name="schoolIds" value={s.id} />
                  <span>
                    {s.schoolCode} {s.name}
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "กำลังส่งต่อ..." : "ยืนยันส่งต่อ"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
