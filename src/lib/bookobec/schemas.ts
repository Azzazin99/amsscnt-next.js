import { z } from "zod";

export const bookobecPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v || v.length === 0) return null;
      return v;
    })
    .refine((v) => v === null || /^\d{13}$/.test(v), {
      message: "เลขบัตรเจ้าหน้าที่ต้อง 13 หลัก",
    }),
});

export const bookobecSyncCodeFormSchema = z.object({
  officeCode: z
    .string()
    .trim()
    .min(1, "กรุณาระบุรหัสหน่วยงาน")
    .max(10, "รหัสหน่วยงานยาวเกินไป"),
  syncCode: z
    .string()
    .trim()
    .min(1, "กรุณาระบุรหัส Sync")
    .max(50, "รหัส Sync ยาวเกินไป"),
});

export const bookobecReceiveRegisterSchema = z.object({
  msIds: z
    .array(z.string().trim().min(1))
    .min(1, "กรุณาเลือกหนังสืออย่างน้อย 1 รายการ"),
});
