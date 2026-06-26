import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antigravity — Autonomous Competitive Intelligence Platform",
  description: "Autonomous real-time competitor intelligence detection, strategic reasoning, and instant Notion publishing engine.",
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
