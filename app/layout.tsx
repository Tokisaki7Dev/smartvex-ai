import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartVex Ultra",
  description: "Premium Video Engine for Creators - AI-Powered Xeon Processing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
