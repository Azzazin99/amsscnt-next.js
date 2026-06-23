import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RegisterReportLinkProps = {
  kind: "receive" | "send" | "command";
  year: number;
};

const KIND_LABELS = {
  receive: "ทะเบียนรับ",
  send: "ทะเบียนส่ง",
  command: "ทะเบียนคำสั่ง",
} as const;

export function RegisterReportLink({ kind, year }: RegisterReportLinkProps) {
  return (
    <Link
      href={`/modules/bookregister/reports/${kind}?year=${year}`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "inline-flex min-h-11 items-center gap-2",
      )}
    >
      <FileSpreadsheet className="size-4" aria-hidden />
      แบบพิมพ์{KIND_LABELS[kind]} ปี {year}
    </Link>
  );
}
