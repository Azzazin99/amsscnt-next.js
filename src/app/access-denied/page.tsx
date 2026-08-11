import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Access Denied | ไม่อนุญาตให้เข้าถึงระบบ",
  description: "ระบบจำกัดการเข้าถึงเฉพาะเครือข่ายภายในที่ได้รับอนุญาตเท่านั้น",
};

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          403 - Access Denied
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          ขออภัย ระบบจำกัดการเข้าใช้งานเฉพาะเครือข่ายภายใน (Intranet) หรือ IP Address ที่ได้รับอนุญาตเท่านั้น
          หมายเลข IP ของคุณไม่เปิดให้เข้าถึงส่วนนี้
        </p>

        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 mb-6">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>Restricted Network Access Control</span>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ลองใหม่อีกครั้ง
          </Link>
        </div>
      </div>
    </div>
  );
}
