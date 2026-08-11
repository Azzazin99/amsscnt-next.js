import { BookobecSyncSettingsForm } from "@/components/bookobec/bookobec-sync-settings-form";
import {
  ensureSystemSyncCodeRow,
  getSystemSyncCode,
} from "@/lib/bookobec/sync-code";
import { requireBookobecSettingsAccess } from "@/lib/bookobec/scope";

export default async function BookobecSettingsPage() {
  await requireBookobecSettingsAccess();
  const row = (await getSystemSyncCode()) ?? (await ensureSystemSyncCodeRow());

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-primary">
          เชื่อมกับ SMART OBEC
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          รหัสหน่วยงานและรหัส Sync จากสำนักนโยบายและแผน สพฐ. (DMC) —
          ใช้เชื่อมรับส่งหนังสือราชการ
        </p>
      </section>

      <BookobecSyncSettingsForm
        officeCode={row.officeCode}
        syncCode={row.syncCode}
      />
    </div>
  );
}
