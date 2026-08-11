import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionRegisterHeaderProps = {
  displayName: string;
  page: number;
  totalPages: number;
  canWrite: boolean;
};

export function PermissionRegisterHeader({
  displayName,
  page,
  totalPages,
  canWrite,
}: PermissionRegisterHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-primary">
            ทะเบียนขออนุญาตไปราชการ
          </h2>
          <p className="text-sm text-foreground">{displayName}</p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/permission/requests/new"
            className={cn(buttonVariants(), "inline-flex min-h-11 shrink-0")}
          >
            เขียนขออนุญาตไปราชการ
          </Link>
        ) : null}
      </div>
      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/modules/permission/requests"
      />
    </header>
  );
}
