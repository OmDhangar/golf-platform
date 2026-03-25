import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "High-Energy Athletic | Golf Charity Platform",
  description: "Golf charity platform — score tracking, monthly draws, and charitable giving.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
