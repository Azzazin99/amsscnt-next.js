"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { tableActionButtonClass } from "@/components/bookregister/table-action-link";
import { deleteDistrictReceive } from "@/lib/bookregister/receive/actions";
import { cn } from "@/lib/utils";

type ReceiveDeleteButtonProps = {
  id: number;
  ariaLabel?: string;
};

export function ReceiveDeleteButton({ id, ariaLabel }: ReceiveDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteDistrictReceive(id);
      if (result && !result.ok) {
        setError(result.message ?? "ลบไม่สำเร็จ");
        return;
      }
      setOpen(false);
      router.push("/modules/bookregister/receive");
      router.refresh();
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next);
          if (!next) setError(null);
        }
      }}
    >
      <button
        type="button"
        disabled={pending}
        aria-label={ariaLabel}
        title="ลบ"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={cn(tableActionButtonClass)}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden />
        )}
      </button>

      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>ลบรายการทะเบียนรับ?</AlertDialogTitle>
          <AlertDialogDescription>
            การลบไม่สามารถกู้คืนได้ ยืนยันว่าต้องการลบรายการนี้
          </AlertDialogDescription>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {pending ? "กำลังลบ…" : "ลบรายการ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
