"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  PERSON_PREFIX_OPTIONS,
  PERSON_SEX_OPTIONS,
  prefixSelectValue,
  sexFromPrefix,
  type PersonSex,
} from "@/lib/person/constants";
import {
  POSITION_OPTIONS,
  SCHOOL_POSITION_OPTIONS,
} from "@/lib/person/position-labels";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { cn } from "@/lib/utils";

type SchoolOption = { id: number; name: string; schoolCode: string };
type WorkgroupOption = { id: number; name: string };

type PersonFormProps = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string; id?: number } | void>;
  title: string;
  cancelHref: string;
  mode: "create" | "edit";
  schools: SchoolOption[];
  workgroups: WorkgroupOption[];
  lockOrg?: boolean;
  defaultValues?: {
    personId?: string;
    prefix?: string | null;
    firstName?: string;
    lastName?: string;
    organizationType?: "district" | "school";
    schoolId?: number | null;
    workgroupId?: number | null;
    positionCode?: number;
    status?: number;
    multiSchool?: boolean;
    extraSchoolIds?: number[];
    serviceStartDate?: string | null;
    sex?: string | null;
    birthDate?: string | null;
    personOrder?: number | null;
    pictureUrl?: string | null;
  };
};

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

export function PersonForm({
  action,
  title,
  cancelHref,
  mode,
  schools,
  workgroups,
  lockOrg = false,
  defaultValues,
}: PersonFormProps) {
  const router = useRouter();
  const [orgType, setOrgType] = useState<"district" | "school">(
    defaultValues?.organizationType ?? "district",
  );
  const [multiSchool, setMultiSchool] = useState(
    defaultValues?.multiSchool ?? false,
  );
  const initialPrefix = prefixSelectValue(defaultValues?.prefix);
  const [sex, setSex] = useState<PersonSex | "">(() => {
    if (defaultValues?.sex === "1" || defaultValues?.sex === "2") {
      return defaultValues.sex;
    }
    return sexFromPrefix(initialPrefix) ?? "";
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (
        mode === "create" &&
        result &&
        "ok" in result &&
        result.ok &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        router.push(`/modules/person/staff/${result.id}/edit`);
        router.refresh();
        return;
      }
      router.refresh();
      router.push(cancelHref);
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-center text-xl font-bold text-teal-800 dark:text-teal-300">
        {title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: เลขประจำตัวประชาชน */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="personId"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            เลขประจำตัวประชาชน
          </label>
          <div className="sm:col-span-8">
            <input
              id="personId"
              name="personId"
              required
              maxLength={13}
              pattern="\d{13}"
              defaultValue={defaultValues?.personId ?? ""}
              className={cn(inputClass, "max-w-xs font-mono")}
            />
          </div>
        </div>

        {/* Row 2: คำนำหน้าชื่อ */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="prefix"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            คำนำหน้าชื่อ
          </label>
          <div className="sm:col-span-8">
            <select
              id="prefix"
              name="prefix"
              required
              defaultValue={initialPrefix}
              className={cn(inputClass, "max-w-xs")}
              onChange={(e) => {
                const next = sexFromPrefix(e.target.value);
                if (next) setSex(next);
              }}
            >
              <option value="">— เลือก —</option>
              {PERSON_PREFIX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input type="hidden" name="sex" value={sex} />
          </div>
        </div>

        {/* Row 3: ชื่อ */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            ชื่อ
          </label>
          <div className="sm:col-span-8">
            <input
              id="firstName"
              name="firstName"
              required
              maxLength={100}
              defaultValue={defaultValues?.firstName ?? ""}
              className={cn(inputClass, "max-w-md")}
            />
          </div>
        </div>

        {/* Row 4: นามสกุล */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            นามสกุล
          </label>
          <div className="sm:col-span-8">
            <input
              id="lastName"
              name="lastName"
              required
              maxLength={100}
              defaultValue={defaultValues?.lastName ?? ""}
              className={cn(inputClass, "max-w-md")}
            />
          </div>
        </div>

        {/* Row 5: วันเดือนปีเกิด */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="birthDate"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            วันเดือนปีเกิด
          </label>
          <div className="sm:col-span-8">
            <ThaiDatePicker
              id="birthDate"
              name="birthDate"
              defaultValue={
                defaultValues?.birthDate && defaultValues.birthDate !== "0000-00-00"
                  ? defaultValues.birthDate
                  : undefined
              }
              placeholder="เลือกวันเดือนปีเกิด"
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Row 6: ตำแหน่ง */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="positionCode"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            ตำแหน่ง
          </label>
          <div className="sm:col-span-8">
            <select
              id="positionCode"
              name="positionCode"
              defaultValue={defaultValues?.positionCode ?? 0}
              className={cn(inputClass, "max-w-md")}
            >
              {(orgType === "school" ? SCHOOL_POSITION_OPTIONS : POSITION_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 7: สถานศึกษา (เฉพาะโรงเรียน) */}
        {orgType === "school" ? (
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
            <label
              htmlFor="schoolId"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
            >
              สถานศึกษา
            </label>
            <div className="sm:col-span-8">
              <select
                id="schoolId"
                name="schoolId"
                defaultValue={defaultValues?.schoolId ?? ""}
                className={cn(inputClass, "max-w-md")}
              >
                <option value="">— เลือกสถานศึกษา —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolCode} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {/* Row 8: ลำดับบุคคลในตำแหน่ง */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="personOrder"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            ลำดับบุคคลในตำแหน่ง
          </label>
          <div className="sm:col-span-8">
            <input
              id="personOrder"
              name="personOrder"
              type="number"
              min={0}
              defaultValue={defaultValues?.personOrder ?? 0}
              className={cn(inputClass, "w-28")}
            />
          </div>
        </div>

        {/* Row 9: กลุ่ม(ถ้ามี) - เฉพาะเขตพื้นที่ */}
        {orgType === "district" ? (
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
            <label
              htmlFor="workgroupId"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
            >
              กลุ่ม(ถ้ามี)
            </label>
            <div className="sm:col-span-8">
              <select
                id="workgroupId"
                name="workgroupId"
                defaultValue={defaultValues?.workgroupId ?? ""}
                className={cn(inputClass, "max-w-md")}
              >
                <option value="">เลือก</option>
                {workgroups.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {/* Row 10: ไฟล์รูปภาพ */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <label
            htmlFor="pictureFile"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right"
          >
            ไฟล์รูปภาพ
          </label>
          <div className="sm:col-span-8">
            <input
              id="pictureFile"
              name="pictureFile"
              type="file"
              accept="image/*"
              className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-100 file:px-3 file:py-1 text-xs file:font-medium hover:file:bg-slate-200 dark:text-slate-300 dark:file:border-slate-700 dark:file:bg-slate-800"
            />
          </div>
        </div>

        {/* Row 11: ปฏิบัติงานโรงเรียนอื่นอีกด้วย (เฉพาะโรงเรียน) */}
        {orgType === "school" ? (
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right">
              ปฏิบัติงานโรงเรียนอื่นอีกด้วย
            </label>
            <div className="sm:col-span-8 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="multiSchoolRadio"
                  checked={multiSchool}
                  onChange={() => setMultiSchool(true)}
                  className="size-4 accent-primary"
                />
                ปฏิบัติ
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="multiSchoolRadio"
                  checked={!multiSchool}
                  onChange={() => setMultiSchool(false)}
                  className="size-4 accent-primary"
                />
                ไม่ได้ปฏิบัติ
              </label>
              <span className="text-xs text-muted-foreground">
                (กรณีเจ้าหน้าที่ธุรการที่ปฏิบัติงานหลายโรงเรียน)
              </span>
            </div>
          </div>
        ) : null}

        {/* Multi-school checklist when multiSchool is true */}
        {orgType === "school" && multiSchool ? (
          <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-12">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-4 sm:text-right pt-1">
              เลือกโรงเรียนเพิ่มเติม
            </label>
            <div className="sm:col-span-8 max-h-48 overflow-y-auto rounded-md border border-input p-3 bg-background space-y-1.5">
              {schools.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="extraSchoolIds"
                    value={s.id}
                    defaultChecked={defaultValues?.extraSchoolIds?.includes(s.id)}
                    className="size-3.5 rounded accent-primary"
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* Hidden Organization Type */}
        <input
          type="hidden"
          name="organizationType"
          value={orgType}
        />

        {error ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {/* Buttons at bottom */}
        <div className="flex items-center justify-center gap-3 pt-6 sm:justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-24 border border-slate-400 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {loading ? "กำลังบันทึก…" : "ตกลง"}
          </Button>
          <Link
            href={cancelHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-w-24 border border-slate-400 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
            )}
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>
    </div>
  );
}
