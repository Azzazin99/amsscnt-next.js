"use client";

import Link from "next/link";
import { useState } from "react";
import { createPersonModulePermission } from "@/lib/person/permissions/actions";
import type { DistrictStaffOption } from "@/lib/person/permissions/queries";

type PersonSysAdminFormProps = {
  staffOptions: DistrictStaffOption[];
  cancelHref: string;
};

export function PersonSysAdminForm({
  staffOptions,
  cancelHref,
}: PersonSysAdminFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      // 'p2' (บันทึก/แก้ไข/สิทธิ์) = true, p1 = true if isOfficer is 'true'
      const isOfficer = formData.get("isOfficer") === "true";
      formData.set("p1", isOfficer ? "true" : "false");
      formData.set("p2", isOfficer ? "true" : "false");
      formData.set("p3", "false");

      const result = await createPersonModulePermission(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <h2 className="text-center text-xl font-bold text-teal-800">
        เพิ่มเจ้าหน้าที่
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="flex items-center justify-center gap-4">
          <label htmlFor="userId" className="shrink-0 font-medium text-black">
            บุคลากร
          </label>
          <select
            id="userId"
            name="userId"
            required
            className="w-64 rounded border border-gray-400 bg-gray-100 p-2 text-sm text-black outline-none focus:border-teal-700"
          >
            <option value="">เลือก</option>
            {staffOptions.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center gap-4">
          <span className="font-medium text-black">อนุญาตให้เป็นเจ้าหน้าที่</span>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="radio"
                name="isOfficer"
                value="true"
                className="size-4 text-blue-600 focus:ring-blue-500"
              />
              ใช่
            </label>
            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="radio"
                name="isOfficer"
                value="false"
                defaultChecked
                className="size-4 text-blue-600 focus:ring-blue-500"
              />
              ไม่ใช่
            </label>
          </div>
        </div>

        {error ? (
          <p className="text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded border border-gray-400 bg-gray-100 px-4 py-1.5 text-sm text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก…" : "ตกลง"}
          </button>
          <Link
            href={cancelHref}
            className="rounded border border-gray-400 bg-gray-100 px-4 py-1.5 text-sm text-black hover:bg-gray-200"
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>
    </div>
  );
}
