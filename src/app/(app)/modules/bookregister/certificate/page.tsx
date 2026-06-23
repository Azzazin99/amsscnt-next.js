import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookregisterListFilters } from "@/components/bookregister/bookregister-list-filters";
import { BookregisterListPageLayout } from "@/components/bookregister/bookregister-list-page-layout";
import { BookregisterListTableSkeleton } from "@/components/bookregister/bookregister-list-table-skeleton";
import { buttonVariants } from "@/components/ui/button";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import {
  canDeleteDistrictRegisters,
  canViewDistrictRegisters,
  canViewSecretDocuments,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { parseListSearchParams } from "@/lib/bookregister/list-search-params";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";
import { cn } from "@/lib/utils";
import { CertificateListSection } from "./certificate-list-section";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    workgroup?: string;
  }>;
};

export default async function DistrictCertificatePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const params = await searchParams;
  const parsed = parseListSearchParams(params);

  const certificateFilters = { q: parsed.filters.q };
  const certificateBaseParams = parsed.q ? { q: parsed.q } : {};

  const canWrite = canWriteDistrictRegisters(session.user, perms);
  const canDeletePerm = canDeleteDistrictRegisters(session.user, perms);

  const visibility: RegisterListVisibility = {
    canViewSecret: canViewSecretDocuments(session.user, perms),
  };

  const activeYear = await getActiveDistrictYear();
  const enabled = activeYear != null && activeYear.startCertificateNum > 0;

  const pageHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนเกียรติบัตร
        </h2>
        {activeYear ? (
          <p className="mt-1 text-sm text-muted-foreground">
            ปีทะเบียนปัจจุบัน: {activeYear.year}
            {!enabled ? " — ทะเบียนเกียรติบัตรไม่เปิดใช้งาน" : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-destructive">
            ยังไม่ได้กำหนดปีปฏิทิน — กรุณาแจ้งเจ้าหน้าที่ทะเบียน
          </p>
        )}
      </div>
      {enabled && canWrite ? (
        <Link
          href="/modules/bookregister/certificate/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          ลงทะเบียนเกียรติบัตร
        </Link>
      ) : enabled ? (
        <button
          type="button"
          disabled
          className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
          title="ไม่มีสิทธิ์บันทึก"
        >
          ลงทะเบียนเกียรติบัตร
        </button>
      ) : (
        <button
          type="button"
          disabled
          className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
          title="ทะเบียนเกียรติบัตรไม่เปิดใช้งานในปีนี้"
        >
          ลงทะเบียนเกียรติบัตร
        </button>
      )}
    </div>
  );

  return (
    <BookregisterListPageLayout
      pageHeader={pageHeader}
      filters={
        <BookregisterListFilters
          basePath="/modules/bookregister/certificate"
          q={parsed.q}
          workgroups={[]}
          workgroupLabelId="certificate-workgroup-label"
          showWorkgroup={false}
          searchPlaceholder="ค้นหาเรื่อง เลขหนังสือ เลขทะเบียน หมายเหตุ…"
        />
      }
      listSlot={
        <Suspense fallback={<BookregisterListTableSkeleton />}>
          <CertificateListSection
            session={session}
            filters={certificateFilters}
            baseParams={certificateBaseParams}
            pageParam={params.page}
            canWrite={canWrite}
            canDeletePerm={canDeletePerm}
            perms={perms}
            visibility={visibility}
          />
        </Suspense>
      }
    />
  );
}

