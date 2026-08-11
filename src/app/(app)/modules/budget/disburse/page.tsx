import { redirect } from "next/navigation";

export default function BudgetDisburseRedirectPage() {
  redirect("/modules/budget/pay/budget");
}
