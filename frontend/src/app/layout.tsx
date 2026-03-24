import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JumpPlusPlus — Platform",
  description: "A modern platform for teams to collaborate and grow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
