import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.archpointlabs.com"),
  title: "Archpoint Labs",
  description: "Archpoint Labs builds what's next — custom apps, websites, and automations that elevate your business. Chat with our AI Assistant, Milo, to explore solutions designed to help your business grow.",
  icons: {
    icon: "/logo-apl-favicon.svg",
    apple: "/sharing/apple-touch-icon-apl.png",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    title: "Archpoint Labs",
    description:
      "Custom apps, websites, and AI automations that elevate your business.",
    url: "https://www.archpointlabs.com/",
    siteName: "Archpoint Labs",
    images: [
      {
        url: "/sharing/og-image.png",
        width: 1200,
        height: 630,
        alt: "Archpoint Labs — We build what's next",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${figtree.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
