import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "AI-EOS — التنسيق التشغيلي بين المصانع",
  description: "نظام شخصي لإدارة التنسيق التشغيلي بين مصانع الآيس كريم والمناديل والكرتون المضلع",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
