import { notFound, redirect } from "next/navigation";
import { NewsArticleForm } from "@/components/news/news-article-form";
import { updateNewsArticle } from "@/lib/news/actions";
import { canWriteNews, getNewsPermissions } from "@/lib/news/permissions";
import {
  getNewsArticle,
  listNewsSectionsForMainitem,
} from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsEditPage({ params }: Props) {
  const { user } = await requireNewsScope();
  const perms = await getNewsPermissions(Number(user.id));
  if (!canWriteNews(user, perms)) redirect("/modules/news");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const article = await getNewsArticle(id);
  if (!article) notFound();

  const sections = await listNewsSectionsForMainitem(article.mainitemCode);

  return (
    <NewsArticleForm
      action={updateNewsArticle.bind(null, id)}
      sections={sections}
      title="แก้ไขข่าว"
      cancelHref="/modules/news"
      defaultValues={{
        sectionCode: article.sectionCode,
        news: article.news,
        hasFile: Boolean(article.file),
      }}
    />
  );
}
