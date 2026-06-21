import type { Metadata, Viewport } from "next";
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

// Per-world signature display faces. Each world's headings get a loaded face
// instead of an OS fallback stack — the cheapest "this is a different world"
// signal there is. Latin subsets only (~8-24KB each).
const chakraPetch = localFont({
  src: "./fonts/chakra-petch-bold.woff2",
  variable: "--font-cyber",
  weight: "700",
  display: "swap",
});

const vt323 = localFont({
  src: "./fonts/vt323-regular.woff2",
  variable: "--font-terminal",
  weight: "400",
  display: "swap",
});

const cormorantGaramond = localFont({
  src: "./fonts/cormorant-garamond-semibold.woff2",
  variable: "--font-gothic",
  weight: "600",
  display: "swap",
});

const poiretOne = localFont({
  src: "./fonts/poiret-one-regular.woff2",
  variable: "--font-deco",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "synthNoirUI",
  description: "A Detective Noir UI Generator",
  icons: {
    icon: "/assets/noir/search-icon-removebg-preview.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body
        className={`${inter.variable} ${specialElite.variable} ${chakraPetch.variable} ${vt323.variable} ${cormorantGaramond.variable} ${poiretOne.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
