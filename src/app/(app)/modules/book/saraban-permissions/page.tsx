import { Check, Edit, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { SarabanDeleteButton } from "@/components/book/saraban-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { listSarabanPermissions } from "@/lib/book/permissions/queries";
import { cn } from "@/lib/utils";

export default async function SarabanPermissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    redirect("/modules/book");
  }

  const rows = await listSarabanPermissions();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">กำหนดสารบรรณ สพท.</h2>
          <p className="text-sm text-muted-foreground">
            กำหนดผู้มีหน้าที่เป็นสารบรรณกลางเขต (สพท.) และ สารบรรณกลุ่ม
          </p>
        </div>
        <Link
          href="/modules/book/saraban-permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มสารบรรณ สพท.
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium text-center w-12">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อเจ้าหน้าที่</th>
              <th className="px-3 py-3 text-center font-medium">สารบรรณกลาง สพท.</th>
              <th className="px-3 py-3 font-medium">สารบรรณกลุ่ม</th>
              <th className="px-3 py-3 text-center font-medium w-24">ลบ</th>
              <th className="px-3 py-3 text-center font-medium w-24">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีผู้ได้รับสิทธิ์สารบรรณ สพท. — กด &quot;เพิ่มสารบรรณ สพท.&quot;
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5 text-center">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    {formatPersonName({
                      prefix: row.prefix,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      fallback: row.displayName,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p1 === 1 ? (
                      <Check className="mx-auto h-5 w-5 text-green-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.p2 > 0 ? row.workgroupName || "-" : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <SarabanDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/book/saraban-permissions/${row.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 text-primary hover:text-primary",
                      )}
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
