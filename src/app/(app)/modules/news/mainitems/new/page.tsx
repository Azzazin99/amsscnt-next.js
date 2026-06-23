import { redirect } from "next/navigation";
import { NewsMainitemForm } from "@/components/news/news-mainitem-form";
import { createNewsMainitem } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { requireNewsScope } from "@/lib/news/scope";

export default async function NewsMainitemNewPage() {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  return (
    <NewsMainitemForm
      action={createNewsMainitem}
      title="เพิ่มชื่อเรื่อง"
      cancelHref="/modules/news/mainitems"
    />
  );
}
