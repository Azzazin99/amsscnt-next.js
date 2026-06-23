type ModuleManualPlaceholderProps = {
  moduleName: string;
};

/** หน้าคู่มือชั่วคราว — จัดทำเนื้อหาจริงหลังพัฒนาโมดูลครบ */
export function ModuleManualPlaceholder({
  moduleName,
}: ModuleManualPlaceholderProps) {
  return (
    <section className="space-y-4">
      <div
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
      >
        คู่มือใช้งาน <strong>ยังไม่สมบูรณ์</strong> — จะกลับมาจัดทำเมื่อพัฒนาโมดูลเสร็จแล้ว
      </div>

      <div>
        <h2 className="text-lg font-semibold text-primary">คู่มือ</h2>
        <p className="mt-1 text-sm text-muted-foreground">{moduleName}</p>
      </div>
    </section>
  );
}
