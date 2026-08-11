"use client";

import { ModuleNav } from "@/components/app-shell/module-nav";
import {
  buildPlanNavSections,
  type PlanNavContext,
} from "@/lib/plan/nav-config";

export function PlanNav(ctx: PlanNavContext) {
  const sections = buildPlanNavSections(ctx);
  return <ModuleNav ariaLabel="เมนูการวางแผน" sections={sections} />;
}
