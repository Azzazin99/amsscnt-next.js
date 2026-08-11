import { redirect } from "next/navigation";

export default function BudgetDisburseNewRedirectPage() {
  redirect("/modules/budget/pay/budget/new");
}
