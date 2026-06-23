import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { AchievementScoreDeleteButton } from "@/components/achievement/achievement-score-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { buildAchievementScoresUrl } from "@/lib/achievement/list-url";
import {
  PAGE_SIZE,
  countAchievementScores,
  listAchievementScoresPage,
  parseAchievementListParams,
  resolveAchievementListPage,
} from "@/lib/achievement/queries";
import { canWriteAchievementScore } from "@/lib/achievement/permissions";
import { requireAchievementScope } from "@/lib/achievement/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; edYear?: string; testType?: string }>;
};

export default async function AchievementScoresPage({ searchParams }: Props) {
  const { user, perms } = await requireAchievementScope();
  const params = await searchParams;
  const parsed = parseAchievementListParams(params);
  const total = await countAchievementScores(parsed.q, parsed.edYear, parsed.testType);
  const page = await resolveAchievementListPage(total, parsed.page);
  const rows = await listAchievementScoresPage({ ...parsed, page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = canWriteAchievementScore(user, perms);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">คะแนนผลสัมฤทธิ์</h2>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("th-TH")} รายการ</p>
        </div>
        {canWrite ? (
          <Link href="/modules/achievement/scores/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>
            บันทึกคะแนน
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-3">
        <input name="q" defaultValue={parsed.q} placeholder="ค้นหาโรงเรียน" className="h-10 min-w-[12rem] flex-1 rounded-lg border px-3 text-sm" />
        <input name="edYear" type="number" defaultValue={parsed.edYear ?? ""} placeholder="ปี พ.ศ." className="h-10 w-28 rounded-lg border px-3 text-sm" />
        <select name="testType" defaultValue={parsed.testType ?? ""} className="h-10 rounded-lg border px-3 text-sm">
          <option value="">ทุกประเภท</option>
          <option value="1">O-NET</option>
          <option value="2">NT</option>
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: "secondary" }), "min-h-10")}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ปี</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">ชั้น</th>
              <th className="px-3 py-3 font-medium">โรงเรียน</th>
              <th className="px-3 py-3 text-center font-medium">เฉลี่ย</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              {canWrite ? <th className="px-3 py-3 text-center font-medium">ลบ</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={canWrite ? 7 : 6} className="px-3 py-8 text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{row.edYear}</td>
                  <td className="px-3 py-2.5">{row.testTypeLabel}</td>
                  <td className="px-3 py-2.5">{row.testClassLabel}</td>
                  <td className="px-3 py-2.5">{row.schoolName ?? row.schoolCode}</td>
                  <td className="px-3 py-2.5 text-center">{row.scoreAvg}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/achievement/scores/${row.id}/edit`} className="text-primary hover:underline">แก้ไข</Link>
                  </td>
                  {canWrite ? (
                    <td className="px-3 py-2.5 text-center"><AchievementScoreDeleteButton id={row.id} /></td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} totalPages={totalPages} hrefForPage={(p) => buildAchievementScoresUrl({ ...parsed, page: p })} />
    </section>
  );
}
