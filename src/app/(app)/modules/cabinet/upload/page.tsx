import { redirect } from "next/navigation";
import { CabinetUploadForm } from "@/components/cabinet/cabinet-upload-form";
import { uploadCabinetDocument } from "@/lib/cabinet/actions";
import {
  canUploadCabinet,
  getCabinetPermissions,
} from "@/lib/cabinet/permissions";
import { requireCabinetScope } from "@/lib/cabinet/scope";

export default async function CabinetUploadPage() {
  const { user } = await requireCabinetScope();
  const perms = await getCabinetPermissions(Number(user.id));
  if (!canUploadCabinet(user, perms)) redirect("/modules/cabinet");

  return (
    <CabinetUploadForm
      action={uploadCabinetDocument}
      cancelHref="/modules/cabinet"
    />
  );
}
