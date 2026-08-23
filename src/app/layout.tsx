import { Source_Sans_3 } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Techchefs WMS",
  description: "Shop and truck inventory for Techchefs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={sourceSans.variable}>{children}</body>
    </html>
  );
}
