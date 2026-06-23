type BookobecEmptyListProps = {
  title: string;
  emptyMessage: string;
  columns: string[];
};

export function BookobecEmptyList({
  title,
  emptyMessage,
  columns,
}: BookobecEmptyListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">0 รายการ</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              {columns.map((column) => (
                <th key={column} className="px-3 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
