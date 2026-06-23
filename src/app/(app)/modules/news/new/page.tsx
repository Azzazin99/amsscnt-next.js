import { redirect } from "next/navigation";
import { NewsArticleForm } from "@/components/news/news-article-form";
import { createNewsArticle } from "@/lib/news/actions";
import { canWriteNews, getNewsPermissions } from "@/lib/news/permissions";
import {
  getActiveNewsMainitem,
  listNewsSectionsForMainitem,
} from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

export default async function NewsNewPage() {
  const { user } = await requireNewsScope();
  const perms = await getNewsPermissions(Number(user.id));
  if (!canWriteNews(user, perms)) redirect("/modules/news");

  const active = await getActiveNewsMainitem();
  if (!active) redirect("/modules/news/mainitems");

  const sections = await listNewsSectionsForMainitem(active.code);
  if (sections.length === 0) redirect("/modules/news/sections");

  return (
    <NewsArticleForm
      action={createNewsArticle}
      sections={sections}
      title="เพิ่มข่าว"
      cancelHref="/modules/news"
    />
  );
}
