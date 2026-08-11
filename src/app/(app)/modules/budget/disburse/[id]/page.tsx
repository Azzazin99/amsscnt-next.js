import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetDisburseDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/modules/budget/pay/budget/${id}`);
}
