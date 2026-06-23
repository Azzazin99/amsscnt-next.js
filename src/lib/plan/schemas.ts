import { z } from "zod";

export const planYearFormSchema = z.object({
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

export const planProjectFormSchema = z
  .object({
    codeClus: z.coerce.number().int().positive("กรุณาเลือกกลุ่มงาน"),
    codeTegy: z.string().trim().max(1).default("1"),
    codeProj: z
      .string()
      .trim()
      .min(1, "กรุณาระบุรหัสโครงการ")
      .max(3, "รหัสโครงการไม่เกิน 3 หลัก"),
    nameProj: z.string().trim().min(1, "กรุณาระบุชื่อโครงการ").max(100),
    budgetProj: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
    ownerProj: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : "")),
    beginDate: z.string().trim().min(1, "กรุณาระบุวันเริ่มต้น"),
    finishDate: z.string().trim().min(1, "กรุณาระบุวันสิ้นสุด"),
  })
  .superRefine((data, ctx) => {
    if (data.beginDate && data.finishDate && data.finishDate < data.beginDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น",
        path: ["finishDate"],
      });
    }
  });

export const planActivityFormSchema = z
  .object({
    codeClus: z.coerce.number().int().positive("กรุณาเลือกกลุ่มงาน"),
    codeProj: z.string().trim().min(1).max(3),
    codeActi: z
      .string()
      .trim()
      .min(1, "กรุณาระบุรหัสกิจกรรม")
      .max(6, "รหัสกิจกรรมไม่เกิน 6 หลัก"),
    nameActi: z.string().trim().min(1, "กรุณาระบุชื่อกิจกรรม").max(100),
    budgetActi: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
    ownerActi: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : "")),
    beginDate: z.string().trim().min(1, "กรุณาระบุวันเริ่มต้น"),
    finishDate: z.string().trim().min(1, "กรุณาระบุวันสิ้นสุด"),
  })
  .superRefine((data, ctx) => {
    if (data.beginDate && data.finishDate && data.finishDate < data.beginDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น",
        path: ["finishDate"],
      });
    }
  });
