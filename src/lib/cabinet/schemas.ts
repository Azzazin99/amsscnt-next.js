import { z } from "zod";

export const cabinetDocumentFormSchema = z.object({
  docSubject: z.string().trim().min(1, "กรุณาระบุชื่อเรื่อง").max(150),
});

export const cabinetPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
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
