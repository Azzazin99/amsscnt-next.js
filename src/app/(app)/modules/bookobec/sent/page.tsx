import Link from "next/link";
import { BookobecIframe } from "@/components/bookobec/bookobec-iframe";
import { getBookobecSentData } from "@/lib/bookobec/page-data";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecSentPage() {
  const { user, perms } = await requireBookobecScope();
  const data = await getBookobecSentData(user, perms);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-primary">
          รายการหนังสือส่ง สพฐ.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ส่งและดูรายการหนังสือที่ส่งไป สพฐ. ผ่าน SmartObec
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

      {data.canSend && data.sendIframeUrl ? (
        <BookobecIframe
          title="ส่งหนังสือ สพฐ."
          src={data.sendIframeUrl}
          height={500}
        />
      ) : null}

      {data.sendReportIframeUrl ? (
        <BookobecIframe
          title="รายการหนังสือส่ง สพฐ."
          src={data.sendReportIframeUrl}
        />
      ) : null}
    </div>
  );
}
