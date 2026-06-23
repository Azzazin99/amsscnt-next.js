"use client";

import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkLogin } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import type { SchoolChoice } from "@/types/next-auth";

type Step = "credentials" | "school";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [schools, setSchools] = useState<SchoolChoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function completeSignIn(
    user: string,
    pass: string,
    school?: string,
  ) {
    const result = await signIn("credentials", {
      username: user,
      password: pass,
      schoolCode: school ?? "",
      redirect: false,
    });

    if (result?.error) {
      setError("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
      return false;
    }

    router.push("/home");
    router.refresh();
    return true;
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await checkLogin({ username, password });

      if (!result.ok) {
        if (result.code === "NEEDS_SCHOOL" && result.schools?.length) {
          setSchools(result.schools);
          setStep("school");
          return;
        }
        setError(result.message);
        return;
      }

      await completeSignIn(username, password);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchoolSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolCode) {
      setError("กรุณาเลือกสถานศึกษา");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await checkLogin({ username, password, schoolCode });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await completeSignIn(username, password, schoolCode);
    } finally {
      setLoading(false);
    }
  }

  if (step === "school") {
    return (
      <form onSubmit={handleSchoolSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">เลือกสถานศึกษาสำหรับปฏิบัติงาน</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            บัญชีของคุณปฏิบัติงานได้มากกว่า 1 โรงเรียน
          </p>
        </div>

        <fieldset className="space-y-2">
          {schools.map((school) => (
            <label
              key={school.schoolCode}
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 has-checked:border-primary has-checked:bg-accent/40"
            >
              <input
                type="radio"
                name="schoolCode"
                value={school.schoolCode}
                checked={schoolCode === school.schoolCode}
                onChange={() => setSchoolCode(school.schoolCode)}
                className="mt-1"
              />
              <span className="text-sm">{school.schoolName}</span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "ตกลง"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => {
              setStep("credentials");
              setSchoolCode("");
              setError(null);
            }}
          >
            ย้อนกลับ
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username / เลขบัตรประชาชน 13 หลัก
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          ครั้งแรกใช้เลขบัตร 13 หลัก (ยังไม่ต้องมีรหัส) · หลัง import ใช้รหัสชั่วคราว{" "}
          <code className="rounded bg-muted px-1">Imported123</code>
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
