import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandCompete — Autonomous Competitive Intelligence",
  description: "Monitor competitors, reason over brand positioning, and publish counter-campaigns autonomously.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
