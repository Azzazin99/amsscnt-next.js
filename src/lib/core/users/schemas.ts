import { z } from "zod";

const orgType = z.enum(["district", "school"]);

const userBaseFields = {
  personId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "เลขบัตรประชาชนต้อง 13 หลัก"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อแสดง").max(255),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255),
  organizationType: orgType,
  schoolId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable(),
  ),
  isAdmin: z.preprocess(
    (val) => val === "on" || val === "true" || val === true || val === "1",
    z.boolean(),
  ),
  status: z.coerce.number().int().refine((v) => v === 0 || v === 1, "สถานะไม่ถูกต้อง"),
};

export const userCreateSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "กรุณากรอก username")
      .max(100)
      .regex(/^[a-zA-Z0-9._-]+$/, "username ใช้ได้เฉพาะตัวอักษร ตัวเลข . _ -"),
    password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัว"),
    ...userBaseFields,
  })
  .superRefine((data, ctx) => {
    if (data.organizationType === "school" && !data.schoolId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกสถานศึกษาสำหรับผู้ใช้โรงเรียน",
        path: ["schoolId"],
      });
    }
    if (data.organizationType === "district" && data.schoolId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ผู้ใช้เขตไม่ต้องระบุสถานศึกษา",
        path: ["schoolId"],
      });
    }
  });

export const userUpdateSchema = z
  .object({
    ...userBaseFields,
    password: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.organizationType === "school" && !data.schoolId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกสถานศึกษา",
        path: ["schoolId"],
      });
    }
    if (data.password !== undefined && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "รหัสผ่านอย่างน้อย 6 ตัว",
        path: ["password"],
      });
    }
  });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
