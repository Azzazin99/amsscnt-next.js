"use client";

import Link from "next/link";
import { useState } from "react";
import { Image as ImageIcon, Pencil, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DistrictSignatureStaffItem = {
  id: number;
  personId: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  positionName: string;
  groupName: string | null;
  hasSignature: boolean;
  signatureUrl?: string | null;
};

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PersonDistrictSignaturesTable({
  initialData,
}: {
  initialData: DistrictSignatureStaffItem[];
}) {
  const [data, setData] = useState<DistrictSignatureStaffItem[]>(initialData);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<DistrictSignatureStaffItem | null>(null);

  const filteredData = data.filter((item) => {
    const fullName = `${item.prefix ?? ""}${item.firstName} ${item.lastName}`;
    return (
      fullName.includes(search) ||
      item.personId.includes(search) ||
      item.positionName.includes(search) ||
      (item.groupName ?? "").includes(search)
    );
  });

  function handleOpenEdit(item: DistrictSignatureStaffItem) {
    setEditingItem(item);
  }

  function handleSaveSignature(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setData((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              hasSignature: true,
              signatureUrl: item.signatureUrl ?? "/signatures/sample_sig.png",
            }
          : item,
      ),
    );
    setEditingItem(null);
  }

  return (
    <>
      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เลขบัตรประจำตัวประชาชน, ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9 w-full`}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          แสดงทั้งหมด {filteredData.length} รายการ
        </p>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="w-14 px-3 py-3 text-center font-medium">ที่</th>
              <th className="w-36 px-3 py-3 font-medium">เลขประชาชน</th>
              <th className="px-3 py-3 font-medium">ชื่อ - นามสกุล</th>
              <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-3 py-3 font-medium">กลุ่ม / ฝ่าย</th>
              <th className="w-24 px-3 py-3 text-center font-medium">ลายเซ็น</th>
              <th className="w-24 px-3 py-3 text-center font-medium">เพิ่ม/แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลบุคลากร สพท.
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.personId}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {row.prefix ?? ""}
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-2.5">{row.positionName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.groupName ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.hasSignature ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <ImageIcon className="size-3.5" />
                        มีลายเซ็น
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(row)}
                      aria-label={`แก้ไขลายเซ็น ${row.firstName}`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่ม / แก้ไขลายเซ็น */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-5 rounded-xl border bg-popover p-6 shadow-lg">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                เพิ่ม / แก้ไขลายเซ็น
              </h3>
              <p className="text-xs text-muted-foreground">
                อัปโหลดไฟล์รูปภาพลายเซ็น (ไฟล์ PNG โปร่งแสง) สำหรับใช้ในเอกสารราชการ
              </p>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-4 text-sm">
              <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                <div className="flex gap-2">
                  <span className="w-16 font-medium text-muted-foreground">ชื่อ:</span>
                  <span className="font-semibold text-foreground">
                    {editingItem.prefix ?? ""}
                    {editingItem.firstName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 font-medium text-muted-foreground">นามสกุล:</span>
                  <span className="font-semibold text-foreground">
                    {editingItem.lastName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 font-medium text-muted-foreground">ตำแหน่ง:</span>
                  <span className="text-muted-foreground">
                    {editingItem.positionName}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signatureFile" className="block text-xs font-medium">
                  ไฟล์รูปภาพ (ไฟล์ PNG)
                </label>
                <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
                  <Upload className="mb-2 size-5 text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    ลากไฟล์รูปภาพมาวาง หรือ <span className="text-primary underline">เลือกไฟล์</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    รองรับเฉพาะไฟล์รูปภาพ PNG (แนะนำพื้นหลังโปร่งใส)
                  </p>
                  <input
                    id="signatureFile"
                    type="file"
                    accept="image/png"
                    required
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  ย้อนกลับ
                </Button>
                <Button type="submit">ตกลง</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
