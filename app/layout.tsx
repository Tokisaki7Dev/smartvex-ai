import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartVex AI",
  description: "High-Performance AI Video Engine. Adaptive Core processing for viral shorts, captions, and b-roll.",
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
