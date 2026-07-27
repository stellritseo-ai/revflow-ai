import type { Metadata } from "next";
import { AppWrapper } from "@/components/layout/app-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevFlow AI — Recover Missed Call Revenue",
  description: "Production-grade enterprise AI workflow engine for dental clinics and medical spas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground min-h-screen">
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
