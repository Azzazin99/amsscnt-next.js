import { z } from "zod";
import { validateIncomingBookNo } from "@/lib/bookregister/validate-book-no";

export const receiveFormSchema = z
  .object({
    schoolCode: z.string().optional(),
    bookFrom: z.string().optional(),
    bookNo: z.string().min(1, "กรุณากรอกเลขที่หนังสือ"),
    signdate: z.string().min(1, "กรุณาระบุลงวันที่"),
    bookTo: z.string().min(1, "กรุณากรอกถึง"),
    subject: z.string().min(1, "กรุณากรอกเรื่อง"),
    workgroupId: z.coerce.number().int().positive("กรุณาเลือกกลุ่มปฏิบัติ"),
    operation: z.string().optional(),
    comment: z.string().optional(),
    urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
    secretLevel: z.coerce.number().int().min(0).max(3).default(0),
    recordType: z.coerce.number().int().min(1).max(2).default(1),
  })
  .superRefine((data, ctx) => {
    const code = data.schoolCode?.trim() ?? "";
    if (code === "other" && !data.bookFrom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุหน่วยงานที่ส่ง",
        path: ["bookFrom"],
      });
    }
    if (!code && !data.bookFrom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกโรงเรียนหรือระบุหน่วยงาน",
        path: ["schoolCode"],
      });
    }
    const bookNoError = validateIncomingBookNo(data.bookNo);
    if (bookNoError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bookNoError,
        path: ["bookNo"],
      });
    }
  });

export type ReceiveFormInput = z.infer<typeof receiveFormSchema>;

/** ทะเบียนรับโรงเรียน — ไม่มีกลุ่มปฏิบัติ / combobox โรงเรียน */
export const receiveSchoolFormSchema = z
  .object({
    bookFrom: z.string().min(1, "กรุณาระบุจาก"),
    bookNo: z.string().min(1, "กรุณากรอกเลขที่หนังสือ"),
    signdate: z.string().min(1, "กรุณาระบุลงวันที่"),
    bookTo: z.string().min(1, "กรุณากรอกถึง"),
    subject: z.string().min(1, "กรุณากรอกเรื่อง"),
    operation: z.string().optional(),
    comment: z.string().optional(),
    urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
    secretLevel: z.coerce.number().int().min(0).max(3).default(0),
    recordType: z.coerce.number().int().min(1).max(2).default(1),
  })
  .superRefine((data, ctx) => {
    const bookNoError = validateIncomingBookNo(data.bookNo);
    if (bookNoError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bookNoError,
        path: ["bookNo"],
      });
    }
  });
