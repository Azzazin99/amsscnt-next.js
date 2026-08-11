import Link from "next/link";
import { BookobecIframe } from "@/components/bookobec/bookobec-iframe";
import { BookobecPendingInbox } from "@/components/bookobec/bookobec-pending-inbox";
import { getBookobecInboxData } from "@/lib/bookobec/page-data";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecInboxPage() {
  const { user, perms } = await requireBookobecScope();
  const data = await getBookobecInboxData(user, perms);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-primary">
          รายการหนังสือรับ สพฐ.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เชื่อมต่อ SmartObec ที่ smart.obec.go.th
        </p>
      </section>

      {!data.syncConfigured ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {data.fetchError}{" "}
          <Link href="/modules/bookobec/settings" className="underline">
            ตั้งค่ารหัสเชื่อม สพฐ.
          </Link>
        </div>
      ) : null}

      {data.fetchError && data.syncConfigured ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {data.fetchError}
        </div>
      ) : null}

      {data.canReceiveRegister ? (
        <BookobecPendingInbox
          alertText={data.alertText}
          items={data.pendingItems}
        />
      ) : null}

      {data.canReceive && data.receiveIframeUrl ? (
        <BookobecIframe title="รับหนังสือ สพฐ." src={data.receiveIframeUrl} />
      ) : null}

      {!data.canReceive && data.receiveOtherIframeUrl ? (
        <BookobecIframe
          title="รายการหนังสือรับ สพฐ."
          src={data.receiveOtherIframeUrl}
        />
      ) : null}
    </div>
  );
}
