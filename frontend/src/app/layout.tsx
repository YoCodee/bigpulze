import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const instrumentSans = localFont({
  src: [
    {
      path: "./fonts/InstrumentSans-VariableFont_wdth,wght.ttf",
      style: "normal",
    },
    {
      path: "./fonts/InstrumentSans-Italic-VariableFont_wdth,wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BizPulse — Asisten Keputusan Bisnis & Smart Voice POS UMKM Multi-Cabang",
  description:
    "Aplikasi web POS multi-cabang dengan input suara cerdas, auto-ledger laba rugi real-time, dan asisten keputusan 3 pertanyaan pagi berbasis deteksi anomali untuk UMKM.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${instrumentSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
