import { z } from "zod";
import { SCHOOL_TYPE_OPTIONS } from "@/lib/core/schools/school-type-labels";

const schoolTypeValues = SCHOOL_TYPE_OPTIONS.map((o) => o.value) as [
  number,
  ...number[],
];

const schoolBaseFields = {
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อสถานศึกษา")
    .max(255, "ชื่อสถานศึกษายาวเกินไป"),
  schoolType: z.coerce
    .number()
    .int()
    .refine((v) => schoolTypeValues.includes(v), "กรุณาเลือกประเภทสถานศึกษา"),
  schoolGroupId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable(),
  ),
  active: z.preprocess(
    (val) => val === "on" || val === "true" || val === true || val === "1",
    z.boolean(),
  ),
};

export const schoolCreateSchema = z.object({
  schoolCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสสถานศึกษา")
    .max(12, "รหัสสถานศึกษายาวเกินไป")
    .regex(/^[0-9A-Za-z-]+$/, "รหัสสถานศึกษาใช้ได้เฉพาะตัวเลข ตัวอักษร และ -"),
  ...schoolBaseFields,
});

export const schoolUpdateSchema = z.object({
  ...schoolBaseFields,
});

export type SchoolCreateInput = z.infer<typeof schoolCreateSchema>;
export type SchoolUpdateInput = z.infer<typeof schoolUpdateSchema>;
