import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { BookregisterScope } from "@/lib/bookregister/scope";
import { cn } from "@/lib/utils";

type RegisterCsvExportLinkProps = {
  kind: "receive" | "send";
  year: number;
  scope: BookregisterScope;
};

export function RegisterCsvExportLink({
  kind,
  year,
  scope,
}: RegisterCsvExportLinkProps) {
  const label =
    kind === "receive" ? "ส่งออก CSV ทะเบียนรับ" : "ส่งออก CSV ทะเบียนส่ง";
  const scopeNote =
    scope.kind === "school" ? ` (${scope.schoolName})` : " (เขต)";

  return (
    <a
      href={`/api/bookregister/export/${kind}?year=${year}`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "inline-flex min-h-11 items-center gap-2",
      )}
    >
      <Download className="size-4" aria-hidden />
      {label} ปี {year}
      <span className="sr-only">{scopeNote}</span>
    </a>
  );
}
