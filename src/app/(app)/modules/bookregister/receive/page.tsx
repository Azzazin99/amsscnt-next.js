import Link from "next/link";
import { Suspense } from "react";
import {
  BookregisterListFilters,
} from "@/components/bookregister/bookregister-list-filters";
import { BookregisterListPageLayout } from "@/components/bookregister/bookregister-list-page-layout";
import { BookregisterListTableSkeleton } from "@/components/bookregister/bookregister-list-table-skeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  canDeleteRegisters,
  canViewSecretDocuments,
  isBookregisterModuleAdmin,
} from "@/lib/bookregister/permissions";
import { listWorkgroupsForFilter } from "@/lib/bookregister/receive/queries";
import { parseListSearchParams } from "@/lib/bookregister/list-search-params";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";
import { cn } from "@/lib/utils";
import { ReceiveListSection } from "./receive-list-section";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    workgroup?: string;
  }>;
};

export default async function DistrictReceivePage({ searchParams }: Props) {
  const { user, perms, scope } = await requireBookregisterScope();

  const params = await searchParams;
  const parsed = parseListSearchParams(params);
  const canWrite = canWriteRegisters(user, perms, scope);
  const canDeletePerm = canDeleteRegisters(user, perms, scope);
  const isModuleAdmin = isBookregisterModuleAdmin(user);
  const visibility = {
    canViewSecret: canViewSecretDocuments(user, perms),
  };

  const [workgroups, activeYear] = await Promise.all([
    listWorkgroupsForFilter(),
    getActiveRegisterYear(scope),
  ]);

  const receiveEnabled =
    activeYear != null && activeYear.startReceiveNum > 0;

  const pageHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนหนังสือรับ
        </h2>
        {scope.kind === "school" ? (
          <p className="mt-1 text-sm text-muted-foreground">{scope.schoolName}</p>
        ) : null}
        {activeYear ? (
          <p className="mt-1 text-sm text-muted-foreground">
            ปีทะเบียนปัจจุบัน: {activeYear.year}
            {!receiveEnabled ? " — ทะเบียนรับไม่เปิดใช้งาน" : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-destructive">
            ยังไม่ได้กำหนดปีปฏิทิน — กรุณาแจ้งเจ้าหน้าที่ทะเบียน
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {receiveEnabled && canWrite ? (
          <Link
            href="/modules/bookregister/receive/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            ลงทะเบียนหนังสือ
          </Link>
        ) : receiveEnabled ? (
          <button
            type="button"
            disabled
            className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
            title="ไม่มีสิทธิ์บันทึก"
          >
            ลงทะเบียนหนังสือ
          </button>
        ) : (
          <button
            type="button"
            disabled
            className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
            title="ทะเบียนรับไม่เปิดใช้งานในปีนี้"
          >
            ลงทะเบียนหนังสือ
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
          basePath="/modules/bookregister/receive"
          q={parsed.q}
          workgroupId={parsed.workgroupId}
          workgroups={workgroups}
          workgroupLabelId="receive-workgroup-label"
          showWorkgroup={scope.kind === "district"}
        />
      }
      listSlot={
        <Suspense fallback={<BookregisterListTableSkeleton />}>
          <ReceiveListSection
            scope={scope}
            userId={Number(user.id)}
            filters={parsed.filters}
            baseParams={parsed.baseParams}
            pageParam={params.page}
            canWrite={canWrite}
            canDeletePerm={canDeletePerm}
            isModuleAdmin={isModuleAdmin}
            visibility={visibility}
          />
        </Suspense>
      }
    />
  );
}
