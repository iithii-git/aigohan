import { Geist, Geist_Mono, M_PLUS_Rounded_1c } from "next/font/google";
import type { Metadata, Viewport } from 'next';
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AI Gohan - AI料理レシピ生成アプリ",
  description: "AI技術を活用して、手持ちの食材から美味しいレシピを自動生成するアプリです。画像から食材を認識し、最適な料理を提案します。",
  keywords: ["AI", "レシピ", "料理", "食材", "画像認識", "Gemini"],
  authors: [{ name: "AI Gohan Team" }],
  robots: "index, follow",
  openGraph: {
    title: "AI Gohan - AI料理レシピ生成アプリ",
    description: "手持ちの食材からAIが最適なレシピを提案",
    type: "website",
    locale: "ja_JP",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mPlusRounded.variable} antialiased`}
      >
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
