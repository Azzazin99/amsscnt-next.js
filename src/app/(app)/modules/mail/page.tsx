import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireMailScope } from "@/lib/mail/scope";
import { canWriteMail } from "@/lib/mail/permissions";
import { cn } from "@/lib/utils";

export default async function MailMainPage() {
  const { user, perms } = await requireMailScope();
  const canWrite = canWriteMail(user, perms);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">รายการหลัก</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ไปรษณีย์ภายใน สพป.ชัยนาท — เลือกทะเบียนรับ ทะเบียนส่ง หรือเขียนจดหมาย
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/modules/mail/inbox"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          ทะเบียนรับ
        </Link>
        <Link
          href="/modules/mail/sent"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex min-h-11")}
        >
          ทะเบียนส่ง
        </Link>
        {canWrite ? (
          <Link
            href="/modules/mail/new"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex min-h-11")}
          >
            เขียนจดหมาย
          </Link>
        ) : null}
      </div>
    </section>
  );
}
