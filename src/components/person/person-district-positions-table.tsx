"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export type PositionItem = {
  code: number;
  name: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PersonDistrictPositionsTable({
  initialData,
}: {
  initialData: PositionItem[];
}) {
  const [data, setData] = useState<PositionItem[]>(initialData);
  const [editingItem, setEditingItem] = useState<PositionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PositionItem | null>(null);

  const [editCode, setEditCode] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");

  function handleOpenEdit(item: PositionItem) {
    setEditingItem(item);
    setEditCode(item.code);
    setEditName(item.name);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setData((prev) =>
      prev.map((item) =>
        item.code === editingItem.code
          ? { ...item, code: editCode, name: editName }
          : item,
      ),
    );
    setEditingItem(null);
  }

  function handleConfirmDelete() {
    if (!deletingItem) return;
    setData((prev) => prev.filter((item) => item.code !== deletingItem.code));
    setDeletingItem(null);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="w-16 px-4 py-3 text-center font-medium">ที่</th>
              <th className="w-20 px-4 py-3 text-center font-medium">รหัส</th>
              <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
              <th className="w-20 px-4 py-3 text-center font-medium">ลบ</th>
              <th className="w-20 px-4 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.code}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-4 py-2.5 text-center text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-4 py-2.5 text-center font-mono font-medium">
                  {row.code}
                </td>
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setDeletingItem(row)}
                    aria-label={`ลบ ${row.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(row)}
                    aria-label={`แก้ไข ${row.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal แก้ไขตำแหน่ง */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border bg-popover p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-primary">
              แก้ไขตำแหน่ง
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="editCode"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  รหัสตำแหน่ง
                </label>
                <input
                  id="editCode"
                  type="number"
                  value={editCode}
                  onChange={(e) => setEditCode(Number(e.target.value))}
                  required
                  className={`${inputClass} w-28`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="editName"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  ชื่อตำแหน่ง
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className={`${inputClass} w-full`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit">บันทึกการแก้ไข</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* AlertDialog ยืนยันการลบ */}
      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบตำแหน่ง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบตำแหน่ง &quot;{deletingItem?.name}&quot; (รหัส{" "}
              {deletingItem?.code}) หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
