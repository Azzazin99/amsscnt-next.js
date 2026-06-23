import { ModuleManualPlaceholder } from "@/components/modules/module-manual-placeholder";
import { requireMailScope } from "@/lib/mail/scope";

export default async function MailManualPage() {
  await requireMailScope();

  return <ModuleManualPlaceholder moduleName="ไปรษณีย์" />;
}
