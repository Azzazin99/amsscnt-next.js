import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AMSS/SMSS — สพป.ชัยนาท",
  description:
    "ระบบสารสนเทศเพื่อการบริหารจัดการสถานศึกษา สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className={sarabun.variable}>
      <body className="min-h-screen font-sans antialiased">
        <AuthSessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
