import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookregisterListFilters } from "@/components/bookregister/bookregister-list-filters";
import { BookregisterListPageLayout } from "@/components/bookregister/bookregister-list-page-layout";
import { BookregisterListTableSkeleton } from "@/components/bookregister/bookregister-list-table-skeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  canDeleteDistrictRegisters,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { parseListSearchParams } from "@/lib/bookregister/list-search-params";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";
import { cn } from "@/lib/utils";
import { CommandListSection } from "./command-list-section";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function DistrictCommandPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const params = await searchParams;
  const parsed = parseListSearchParams(params);
  const commandFilters = { q: parsed.filters.q };
  const commandBaseParams = parsed.q ? { q: parsed.q } : {};

  const canWrite = canWriteDistrictRegisters(session.user, perms);
  const canDeletePerm = canDeleteDistrictRegisters(session.user, perms);

  const activeYear = await getActiveDistrictYear();
  const commandEnabled =
    activeYear != null && activeYear.startCommandNum > 0;

  const pageHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-primary">ทะเบียนคำสั่ง</h2>
        {activeYear ? (
          <p className="mt-1 text-sm text-muted-foreground">
            ปีทะเบียนปัจจุบัน: {activeYear.year}
            {!commandEnabled ? " — ทะเบียนคำสั่งไม่เปิดใช้งาน" : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-destructive">
            ยังไม่ได้กำหนดปีปฏิทิน — กรุณาแจ้งเจ้าหน้าที่ทะเบียน
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {commandEnabled && canWrite ? (
        <Link
          href="/modules/bookregister/command/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          ลงทะเบียนคำสั่ง
        </Link>
      ) : commandEnabled ? (
        <button
          type="button"
          disabled
          className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
          title="ไม่มีสิทธิ์บันทึก"
        >
          ลงทะเบียนคำสั่ง
        </button>
      ) : (
        <button
          type="button"
          disabled
          className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
          title="ทะเบียนคำสั่งไม่เปิดใช้งานในปีนี้"
        >
          ลงทะเบียนคำสั่ง
        </button>
      )}
      </div>
    </div>
  );

  return (
    <BookregisterListPageLayout
      pageHeader={pageHeader}
      filters={
        <BookregisterListFilters
          basePath="/modules/bookregister/command"
          q={parsed.q}
          workgroups={[]}
          workgroupLabelId="command-workgroup-label"
          showWorkgroup={false}
          searchPlaceholder="ค้นหาเรื่อง เลขหนังสือ เลขทะเบียน หมายเหตุ…"
        />
      }
      listSlot={
        <Suspense fallback={<BookregisterListTableSkeleton />}>
          <CommandListSection
            session={session}
            filters={commandFilters}
            baseParams={commandBaseParams}
            pageParam={params.page}
            canWrite={canWrite}
            canDeletePerm={canDeletePerm}
            perms={perms}
          />
        </Suspense>
      }
    />
  );
}
