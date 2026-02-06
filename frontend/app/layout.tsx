import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SwiftPay - Instant Crypto Payments",
  description: "Pay merchants instantly with ENS names. Settle in USDC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans text-white antialiased`} style={{ backgroundColor: '#1f1f1f' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
