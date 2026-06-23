import type { ReactNode } from "react";
import { BOOKREGISTER_LIST_REGION_MIN_HEIGHT } from "@/lib/bookregister/list-constants";
import { cn } from "@/lib/utils";

type BookregisterListPageLayoutProps = {
  pageHeader: ReactNode;
  filters: ReactNode;
  listSlot: ReactNode;
};

export function BookregisterListPageLayout({
  pageHeader,
  filters,
  listSlot,
}: BookregisterListPageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div
        className={cn(
          "sticky z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 pb-4 backdrop-blur",
          "supports-[backdrop-filter]:bg-background/80 lg:-mx-8 lg:px-8",
          "top-14 lg:top-[6.25rem]",
        )}
      >
        <div className="space-y-4">
          {pageHeader}
          {filters}
        </div>
      </div>

      {/* ไม่ใส่ overflow-y ที่นี่ — จะทำให้ sticky คอลัมน์ขวาในตารางไม่ทำงาน */}
      <div
        className="relative min-h-0 flex-1 pt-4"
        style={{ minHeight: BOOKREGISTER_LIST_REGION_MIN_HEIGHT }}
      >
        {listSlot}
      </div>
    </div>
  );
}
