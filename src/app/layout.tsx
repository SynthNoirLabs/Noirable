import type { Metadata } from "next";
import { Inter, Special_Elite } from "next/font/google";
import "./globals.css";
import { SandpackStyles } from "@/components/eject/SandpackStyles";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-typewriter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "synthNoirUI",
  description: "A Detective Noir UI Generator",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SandpackStyles />
      </head>
      <body className={`${inter.variable} ${specialElite.variable} antialiased`}>{children}</body>
    </html>
  );
}
