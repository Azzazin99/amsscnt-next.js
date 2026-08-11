import assert from "node:assert/strict";
import {
  BUDGET_NAV_CHECK_LABELS,
  buildBudgetNavSections,
  BUDGET_NAV_FLYOUT_GROUP_LABELS,
} from "./nav-config";

const sections = buildBudgetNavSections({
  settingsNavMode: "full",
  showStaffMenus: true,
  canSettings: true,
  canAllocation: true,
  canReceiveBudget: true,
  canReceiveExtra: true,
  canReceiveIncome: true,
  canWithdraw: true,
  canDeega: true,
  canPayBudget: true,
  canPayExtra: true,
  canPayIncome: true,
  canPayReserve: true,
  canPayCheck: true,
  canChangeBudget: true,
  canChangeExtra: true,
  canChangeIncome: true,
  canChecks: true,
  showWideReports: true,
  showDebtReports: true,
});

const flyoutLabels = sections.flatMap((s) =>
  s.links.filter((l) => l.children).map((l) => l.label),
);

for (const label of BUDGET_NAV_FLYOUT_GROUP_LABELS) {
  if (label === "ตั้งค่าระบบ") {
    assert.ok(sections.some((s) => s.title === "ตั้งค่าระบบ"), label);
    continue;
  }
  assert.ok(flyoutLabels.includes(label), `missing flyout: ${label}`);
}

const requiredHrefs = [
  "/modules/budget/permissions",
  "/modules/budget/years",
  "/modules/budget/plans",
  "/modules/budget/allocation",
  "/modules/budget/receive/budget",
  "/modules/budget/withdraw",
  "/modules/budget/deega",
  "/modules/budget/pay/budget",
  "/modules/budget/pay-check/main",
  "/modules/budget/status-change/budget",
  "/modules/budget/checks/allocation",
  "/modules/budget/reports/allocation",
  "/modules/budget/manual",
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

const checkLabels =
  sections
    .flatMap((s) => s.links)
    .find((l) => l.label === "ตรวจสอบ")
    ?.children?.map((c) => c.label) ?? [];

assert.deepEqual(
  checkLabels,
  [...BUDGET_NAV_CHECK_LABELS],
  "budget check menu must match legacy order",
);

console.log("OK: budget nav self-check");
