import { z } from "zod";

export const newsMainitemFormSchema = z.object({
  code: z.coerce.number().int().positive("กรุณาระบุรหัส"),
  mainitem: z.string().trim().min(1, "กรุณาระบุชื่อเรื่อง").max(150),
  itemActive: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export const newsSectionFormSchema = z.object({
  code: z.coerce.number().int().min(1).max(99, "รหัสประเภทต้อง 1–99"),
  name: z.string().trim().min(1, "กรุณาระบุชื่อประเภท").max(100),
});

export const newsArticleFormSchema = z.object({
  sectionCode: z.coerce.number().int().positive("กรุณาเลือกประเภท"),
  news: z.string().trim().min(1, "กรุณาระบุข้อความข่าว").max(250),
});

export const newsPermissionFormSchema = z.object({
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
