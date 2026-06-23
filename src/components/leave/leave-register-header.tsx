import { ListPagination } from "@/components/core/list-pagination";

type LeaveRegisterHeaderProps = {
  displayName: string;
  page: number;
  totalPages: number;
};

export function LeaveRegisterHeader({
  displayName,
  page,
  totalPages,
}: LeaveRegisterHeaderProps) {
  return (
    <header className="space-y-2 text-center">
      <h2 className="text-lg font-semibold text-primary">ทะเบียนการลา</h2>
      <p className="text-sm text-foreground">{displayName}</p>
      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/modules/leave/requests"
      />
    </header>
  );
}
