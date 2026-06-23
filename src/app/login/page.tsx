import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <p className="text-sm font-semibold text-primary">AMSS/SMSS</p>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              สำหรับบุคลากร สพป.ชัยนาท
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="text-primary underline-offset-4 hover:underline"
            >
              ← กลับหน้าแรก
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
