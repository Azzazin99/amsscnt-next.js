import { redirect } from "next/navigation";
import { NewsSectionForm } from "@/components/news/news-section-form";
import { createNewsSection } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { getActiveNewsMainitem } from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

export default async function NewsSectionNewPage() {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const active = await getActiveNewsMainitem();
  if (!active) redirect("/modules/news/mainitems");

  return (
    <NewsSectionForm
      action={createNewsSection}
      title="เพิ่มประเภทข่าว"
      cancelHref="/modules/news/sections"
    />
  );
}
