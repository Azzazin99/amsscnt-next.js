import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveEditRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/modules/budget/receive/budget/${id}/edit`);
}
