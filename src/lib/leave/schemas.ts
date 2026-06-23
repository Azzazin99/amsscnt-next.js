import { z } from "zod";
import { PHONE_DIGITS_ONLY_MESSAGE } from "@/lib/form/validation-messages";
import { formEntryString } from "@/lib/form/zod-client";
import { isLeaveTypeId } from "@/lib/leave/regulation/types";

const optionalTrimmedToNull = (max: number) =>
  formEntryString(
    z
      .string()
      .trim()
      .max(max)
      .transform((v) => (v.length > 0 ? v : null)),
  );

const halfDayPeriodSchema = formEntryString(
  z.string().trim().transform((v) => {
    if (!v || v.length === 0) return null;
    if (v === "morning" || v === "afternoon") return v;
    return null;
  }),
);

export const leaveRequestCreateSchema = z.object({
  leaveType: z.coerce
    .number()
    .int()
    .refine((v) => isLeaveTypeId(v), "กรุณาเลือกประเภทการลา"),
  writeAt: optionalTrimmedToNull(100),
  because: formEntryString(
    z.string().trim().min(1, "กรุณาระบุเหตุผล").max(250),
  ),
  leaveStart: formEntryString(
    z.string().trim().min(1, "กรุณาระบุวันเริ่มลา"),
  ),
  leaveFinish: formEntryString(
    z.string().trim().min(1, "กรุณาระบุวันสิ้นสุดลา"),
  ),
  halfDayPeriod: halfDayPeriodSchema,
  contact: optionalTrimmedToNull(150),
  contactTel: formEntryString(
    z
      .string()
      .trim()
      .max(20)
      .regex(/^\d*$/, PHONE_DIGITS_ONLY_MESSAGE)
      .transform((v) => (v.length > 0 ? v : null)),
  ),
  noComment: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  grantPersonSelected: formEntryString(
    z
      .string()
      .trim()
      .transform((v) => (v.length > 0 ? v : null))
      .refine((v) => v === null || /^\d{13}$/.test(v), {
        message: "เลขบัตรผู้อนุมัติต้อง 13 หลัก",
      }),
  ),
  jobPersonId: formEntryString(
    z
      .string()
      .trim()
      .transform((v) => (v.length > 0 ? v : null))
      .refine((v) => v === null || /^\d{13}$/.test(v), {
        message: "เลขบัตรผู้รับมอบงานต้อง 13 หลัก",
      }),
  ),
  documentName: optionalTrimmedToNull(100),
});

export const leaveCancellationCreateSchema = z.object({
  sourceRequestId: z.coerce
    .number()
    .int()
    .positive("กรุณาเลือกคำขอลาที่อนุมัติแล้ว"),
  writeAt: optionalTrimmedToNull(100),
  because: formEntryString(
    z.string().trim().min(1, "กรุณาระบุเหตุผล").max(200),
  ),
  cancelStart: formEntryString(
    z.string().trim().min(1, "กรุณาระบุวันเริ่มที่ยกเลิก"),
  ),
  cancelFinish: formEntryString(
    z.string().trim().min(1, "กรุณาระบุวันสิ้นสุดที่ยกเลิก"),
  ),
  noComment: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  grantPersonSelected: formEntryString(
    z
      .string()
      .trim()
      .transform((v) => (v.length > 0 ? v : null))
      .refine((v) => v === null || /^\d{13}$/.test(v), {
        message: "เลขบัตรผู้อนุมัติต้อง 13 หลัก",
      }),
  ),
});

export const leaveStepApproveSchema = z.object({
  step: z.enum(["group", "group2", "commander"]),
  grant: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "กรุณาเลือกผลการพิจารณา"),
  comment: optionalTrimmedToNull(200),
});

/** @deprecated use leaveStepApproveSchema */
export const leaveApproveSchema = z.object({
  commanderGrant: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "กรุณาเลือกผลการพิจารณา"),
  commanderComment: optionalTrimmedToNull(100),
});

export const leaveYearFormSchema = z.object({
  budgetYear: z.coerce
    .number()
    .int()
    .min(2500, "ปีงบประมาณไม่ถูกต้อง")
    .max(2700, "ปีงบประมาณไม่ถูกต้อง"),
  yearActive: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export const leavePermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: formEntryString(
    z
      .string()
      .trim()
      .transform((v) => (v.length > 0 ? v : null))
      .refine((v) => v === null || /^\d{13}$/.test(v), {
        message: "เลขบัตรเจ้าหน้าที่ต้อง 13 หลัก",
      }),
  ),
});

const optionalPersonId = formEntryString(
  z
    .string()
    .trim()
    .transform((v) => (v.length > 0 ? v : null))
    .refine((v) => v === null || /^\d{13}$/.test(v), {
      message: "เลขบัตรประชาชนต้อง 13 หลัก",
    }),
);

export const leaveGrantPersonFormSchema = z.object({
  commentPersonId: optionalPersonId,
  commentPerson2Id: optionalPersonId,
  grantPersonId: optionalPersonId,
});

export const leaveCollectRowSchema = z.object({
  personId: formEntryString(
    z.string().trim().regex(/^\d{13}$/, "เลขบัตรประชาชนต้อง 13 หลัก"),
  ),
  collectDay: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  thisYearDay: z.coerce.number().int().min(0, "ต้องไม่ติดลบ"),
});

export const schoolGrantDeputyFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
});
