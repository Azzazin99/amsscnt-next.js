export default function BookregisterReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .register-report {
            background: #fff !important;
            color: #171717 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          nav[aria-label="เมนูทะเบียนหนังสือ"],
          header.sticky,
          [data-app-breadcrumb] {
            display: none !important;
          }
        }
      `}</style>
      {children}
    </>
  );
}
