import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SandpackStyles } from "@/components/eject/SandpackStyles";

const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const specialElite = localFont({
  src: "./fonts/special-elite-regular.woff2",
  variable: "--font-typewriter",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "synthNoirUI",
  description: "A Detective Noir UI Generator",
  icons: {
    icon: "/assets/noir/search-icon.png",
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
