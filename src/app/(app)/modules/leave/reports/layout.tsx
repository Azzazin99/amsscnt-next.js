import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายงาน — ระบบการลา",
};

export default function LeaveReportsLayout({
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
