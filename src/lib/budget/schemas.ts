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

export const budgetAllocationFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetCancelDeegaFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetDeegaFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetMoneyReturnFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetPayKindFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetPoFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetReceiveKindFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetReserveMoneyFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetStatusChangeFormSchema = budgetReceiveFormSchema.passthrough();
export const budgetPermissionFormSchema = z.object({
  personId: z.string().trim().min(1, "กรุณาเลือกบุคลากร"),
  p1: z.coerce.number().default(0),
  p2: z.coerce.number().default(0),
  p3: z.coerce.number().default(0),
  p4: z.coerce.number().default(0),
  p5: z.coerce.number().default(0),
  p6: z.coerce.number().default(0),
  p7: z.coerce.number().default(0),
  p8: z.coerce.number().default(0),
  p9: z.coerce.number().default(0),
  p10: z.coerce.number().default(0),
});

export const budgetTypeFormSchema = z.object({
  typeId: z.string().min(1),
  typeName: z.string().min(1),
});
export const budgetPayTypeFormSchema = z.object({
  payGroupId: z.coerce.number().int().positive("กรุณาเลือกงบรายจ่าย"),
  payTypeId: z.coerce.number().int().positive("กรุณาระบุรหัสประเภทการจ่าย"),
  payTypeName: z.string().min(1, "กรุณาระบุชื่อประเภทการจ่าย"),
});

export const budgetWithdrawFormSchema = budgetDisburseFormSchema.passthrough();
export const budgetCodeFormSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});
