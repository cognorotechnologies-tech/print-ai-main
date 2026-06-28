import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrintAI - AI-Powered Print on Demand",
  description: "Create custom T-shirt designs using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
