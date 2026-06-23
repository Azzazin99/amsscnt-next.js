import { z } from "zod";
import { validateOutgoingBookNo } from "@/lib/bookregister/validate-book-no";

const sendBaseFields = {
  bookFrom: z.string().min(1, "กรุณากรอกหน่วยงานที่ส่ง (จาก)"),
  bookTo: z.string().min(1, "กรุณากรอกผู้รับ (ถึง)"),
  signdate: z.string().min(1, "กรุณาระบุลงวันที่"),
  subject: z.string().min(1, "กรุณากรอกเรื่อง"),
  workgroupId: z.coerce.number().int().positive("กรุณาเลือกกลุ่มปฏิบัติ"),
  operation: z.string().optional(),
  comment: z.string().optional(),
  urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
  secretLevel: z.coerce.number().int().min(0).max(3).default(0),
};

export const sendCreateSchema = z.object({
  ...sendBaseFields,
  officeType: z.coerce.number().int().min(1).max(3).default(1),
});

export const sendUpdateSchema = z
  .object({
    ...sendBaseFields,
    bookNo: z.string().min(1, "กรุณากรอกเลขที่หนังสือ"),
    officeType: z.coerce.number().int().min(1).max(3).optional(),
  })
  .superRefine((data, ctx) => {
    const bookNoError = validateOutgoingBookNo(data.bookNo);
    if (bookNoError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bookNoError,
        path: ["bookNo"],
      });
    }
  });

export type SendCreateInput = z.infer<typeof sendCreateSchema>;
export type SendUpdateInput = z.infer<typeof sendUpdateSchema>;

const sendSchoolBaseFields = {
  bookFrom: z.string().min(1, "กรุณากรอกหน่วยงานที่ส่ง (จาก)"),
  bookTo: z.string().min(1, "กรุณากรอกผู้รับ (ถึง)"),
  signdate: z.string().min(1, "กรุณาระบุลงวันที่"),
  subject: z.string().min(1, "กรุณากรอกเรื่อง"),
  operation: z.string().optional(),
  comment: z.string().optional(),
  urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
  secretLevel: z.coerce.number().int().min(0).max(3).default(0),
};

export const sendSchoolCreateSchema = z.object({
  ...sendSchoolBaseFields,
  officeType: z.coerce.number().int().min(1).max(3).default(1),
});

export const sendSchoolUpdateSchema = z
  .object({
    ...sendSchoolBaseFields,
    bookNo: z.string().min(1, "กรุณากรอกเลขที่หนังสือ"),
    officeType: z.coerce.number().int().min(1).max(3).optional(),
  })
  .superRefine((data, ctx) => {
    const bookNoError = validateOutgoingBookNo(data.bookNo);
    if (bookNoError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bookNoError,
        path: ["bookNo"],
      });
    }
  });
