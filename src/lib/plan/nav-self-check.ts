import assert from "node:assert/strict";
import {
  buildPlanNavSections,
  PLAN_NAV_FLYOUT_GROUP_LABELS,
} from "./nav-config";
import { formatPlanActivitySourceLabel } from "./queries";

assert.equal(formatPlanActivitySourceLabel("2_3"), "งบประมาณงวด 3");
assert.equal(formatPlanActivitySourceLabel("1_A"), "นอกงบประมาณ(A)");
assert.equal(formatPlanActivitySourceLabel(""), "ยังไม่ได้กำหนด");
assert.equal(formatPlanActivitySourceLabel("", { missing: "empty" }), "");

const sections = buildPlanNavSections({
  settingsNavMode: "full",
  canOperate: true,
  canAdd: true,
  showDistrictMenus: true,
  showDistrictReports: true,
});

const flyoutLabels = sections.flatMap((s) =>
  s.links.filter((l) => l.children).map((l) => l.label),
);

for (const label of PLAN_NAV_FLYOUT_GROUP_LABELS) {
  if (label === "ตั้งค่าระบบ") {
    assert.ok(sections.some((s) => s.title === "ตั้งค่าระบบ"), label);
    continue;
  }
  assert.ok(flyoutLabels.includes(label), `missing flyout: ${label}`);
}

const requiredHrefs = [
  "/modules/plan/permissions",
  "/modules/plan/years",
  "/modules/plan/strategies",
  "/modules/plan/projects",
  "/modules/plan/attachments",
  "/modules/plan/smss-import",
  "/modules/plan/surplus/projects",
  "/modules/plan/surplus/reports/allocation",
  "/modules/plan/surplus/activities/stop",
  "/modules/plan/surplus/reports/remaining",
  "/modules/plan/checks/installment-register",
  "/modules/plan/checks/allocation",
  "/modules/plan/checks/spending",
  "/modules/plan/reports/by-workgroup",
  "/modules/plan/reports/allocation-summary",
  "/modules/plan/reports/by-strategy",
  "/modules/plan/reports/owner-results",
  "/modules/plan/reports/surplus-projects",
  "/modules/plan/manual",
];

const hrefs = sections.flatMap((s) =>
  s.links.flatMap((l) => [
    ...(l.href ? [l.href] : []),
    ...(l.children?.map((c) => c.href).filter(Boolean) ?? []),
  ]),
);

for (const href of requiredHrefs) {
  assert.ok(hrefs.includes(href), `missing nav href: ${href}`);
}

console.log("OK: plan nav self-check");
