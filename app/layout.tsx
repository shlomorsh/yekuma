import type { Metadata } from "next";
import { Geist, Geist_Mono, Heebo, Assistant } from "next/font/google";
import "./globals.css";
import GunCursor from "./components/GunCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "יקומה",
  description: "יקומה - היקום של יקומות - מערכת רפרנסים לפרקי יקומות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} ${assistant.variable} antialiased`}
      >
        <GunCursor />
        {children}
      </body>
    </html>
  );
}
