"use client";

import { useActionState } from "react";
import { updateBookobecSyncCode } from "@/lib/bookobec/actions";
import { Button } from "@/components/ui/button";

type BookobecSyncSettingsFormProps = {
  officeCode: string;
  syncCode: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BookobecSyncSettingsForm({
  officeCode,
  syncCode,
}: BookobecSyncSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { message?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await updateBookobecSyncCode(formData);
      return { message: result.message, ok: result.ok };
    },
    null,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <label htmlFor="officeCode" className="text-sm font-medium">
          รหัสหน่วยงาน (จาก สพฐ./DMC)
        </label>
        <input
          id="officeCode"
          name="officeCode"
          defaultValue={officeCode}
          maxLength={10}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="syncCode" className="text-sm font-medium">
          รหัส Sync
        </label>
        <input
          id="syncCode"
          name="syncCode"
          defaultValue={syncCode}
          maxLength={50}
          required
          className={inputClass}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึกรหัสเชื่อม"}
      </Button>

      {state?.message ? (
        <p
          role="alert"
          className={`text-sm ${state.ok ? "text-green-700" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
