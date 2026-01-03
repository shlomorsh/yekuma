import type { Metadata } from "next";
import { Rubik, Heebo, Assistant } from "next/font/google";
import "./globals.css";
import GunCursor from "./components/GunCursor";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
  description: "יקומה - היקום של יקומות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${rubik.variable} ${heebo.variable} ${assistant.variable} antialiased`}
        style={{ fontFamily: 'var(--font-rubik), var(--font-heebo), sans-serif' }}
      >
        {/* Scanlines overlay for retro effect */}
        <div className="scanlines" />
        <GunCursor />
        {children}
      </body>
    </html>
  );
}
