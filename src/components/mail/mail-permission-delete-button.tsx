"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteMailPermission } from "@/lib/mail/actions";

type Props = {
  id: number;
};

export function MailPermissionDeleteButton({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("ลบสิทธิ์นี้?")) return;
    setLoading(true);
    try {
      await deleteMailPermission(id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-muted disabled:opacity-50"
      aria-label="ลบ"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
