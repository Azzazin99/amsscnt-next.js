"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptJobHandover } from "@/lib/leave/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaveJobHandoverButtonProps = {
  requestId: number;
};

export function LeaveJobHandoverButton({ requestId }: LeaveJobHandoverButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={loading}
        className={cn(buttonVariants({ size: "sm" }))}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const result = await acceptJobHandover(requestId);
          setLoading(false);
          if (!result.ok) {
            setError(result.message ?? "ไม่สำเร็จ");
            return;
          }
          router.refresh();
        }}
      >
        {loading ? "กำลังบันทึก…" : "รับมอบงานแล้ว"}
      </button>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
