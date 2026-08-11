type PlanEmptyStateProps = {
  title: string;
  message: string;
};

export function PlanEmptyState({ title, message }: PlanEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
