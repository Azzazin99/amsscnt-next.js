import { z } from "zod";

const boolRadio = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const districtPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: boolRadio,
  p2: boolRadio,
  p3: boolRadio,
  canViewSecret: boolRadio,
});

export type DistrictPermissionFormInput = z.infer<
  typeof districtPermissionFormSchema
>;
