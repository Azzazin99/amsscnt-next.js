import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายงาน — ขออนุญาตไปราชการ",
};

export default function PermissionReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      {children}
    </>
  );
}
