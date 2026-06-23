"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppMenuList } from "@/components/app-shell/app-menu-list";
import type { AppMenuGroup } from "@/lib/modules/get-app-menu";

type AppMobileMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: AppMenuGroup[];
};

export function AppMobileMenu({
  open,
  onOpenChange,
  menu,
}: AppMobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>เมนูโมดูล</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto p-3 pb-8">
          <AppMenuList
            menu={menu}
            onNavigate={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
