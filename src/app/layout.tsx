import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Bun Starter",
  description: "Next.js 16 + Bun + Elysia + Drizzle + better-auth boilerplate",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
