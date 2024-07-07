import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/Sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LabelMate-User",
  description: "LabelMate is a decentralized web application that streamlines data labeling tasks, allowing users to earn Solana while ensuring secure and efficient task management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster richColors/>
        {children}
      </body>
    </html>
  );
}
