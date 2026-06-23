import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaveRegisterActionsProps = {
  canWrite: boolean;
};

export function LeaveRegisterActions({ canWrite }: LeaveRegisterActionsProps) {
  if (!canWrite) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Link
        href="/modules/leave/requests/new?group=sick"
        className={cn(buttonVariants())}
      >
        ขออนุญาตลาป่วย ลากิจ ลาคลอด
      </Link>
      <Link
        href="/modules/leave/requests/new?group=vacation"
        className={cn(buttonVariants())}
      >
        ขออนุญาตลาพักผ่อน
      </Link>
    </div>
  );
}
