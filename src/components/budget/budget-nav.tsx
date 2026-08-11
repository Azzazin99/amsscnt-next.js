"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import { buildBudgetNavSections } from "@/lib/budget/nav-config";
import type { BudgetNavContext } from "@/lib/budget/nav-config";

type BudgetNavProps = BudgetNavContext;

export function BudgetNav(props: BudgetNavProps) {
  const sections: ModuleNavSectionDef[] = buildBudgetNavSections(props);
  return <ModuleNav ariaLabel="เมนูการเงินและบัญชี" sections={sections} />;
}
