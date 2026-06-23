import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <p className="text-sm font-semibold text-primary">AMSS/SMSS · สพป.ชัยนาท</p>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <section className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-primary">Bootstrap</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            ระบบ AMSS/SMSS สำหรับ สพป.ชัยนาท
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Next.js + PostgreSQL — P010 Login · P011 App shell พร้อมแล้ว
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className={cn(buttonVariants())}>
              เข้าสู่ระบบ
            </Link>
            <a
              className={cn(buttonVariants({ variant: "outline" }))}
              href="https://amsscnt.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              เปรียบเทียบ amsscnt.com
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
