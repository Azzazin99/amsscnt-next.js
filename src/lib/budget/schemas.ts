import { z } from "zod";

export const budgetYearFormSchema = z.object({
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

export const budgetReceiveFormSchema = z.object({
  recDate: z.string().trim().min(1, "กรุณาระบุวันที่"),
  doc: z.string().trim().min(1, "กรุณาระบุที่เอกสาร").max(30),
  item: z.string().trim().min(1, "กรุณาระบุรายการ").max(100),
  status: z.coerce
    .number()
    .int()
    .refine((v) => v === 1 || v === 2, "กรุณาเลือกลักษณะรายการ"),
  receiveAmount: z.coerce.number().positive("กรุณาระบุจำนวนเงิน"),
});

export const budgetDisburseFormSchema = z.object({
  recDate: z.string().trim().min(1, "กรุณาระบุวันที่"),
  doc: z.string().trim().min(1, "กรุณาระบุที่เอกสาร").max(30),
  item: z.string().trim().min(1, "กรุณาระบุรายการจ่าย").max(100),
  payGroup: z.coerce.number().int().positive("กรุณาเลือกงบรายจ่าย"),
  payAmount: z.coerce.number().positive("กรุณาระบุจำนวนเงิน"),
  payedPerson: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});
