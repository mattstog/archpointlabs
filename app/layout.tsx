import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  // ✅ Use apex domain as the base
  metadataBase: new URL("https://archpointlabs.com"),
  title: "Archpoint Labs",
  description:
    "Archpoint Labs builds what's next — custom apps, websites, and automations that elevate your business. Chat with our AI Assistant, Milo, to explore solutions designed to help your business grow.",
  icons: {
    icon: "/logo-apl-favicon.svg",
    apple: "/sharing/apple-touch-icon-apl.png",
  },
  // ✅ Explicit canonical
  alternates: {
    canonical: "/", // resolves to https://archpointlabs.com/
  },
  openGraph: {
    title: "Archpoint Labs",
    description:
      "Custom apps, websites, and AI automations that elevate your business.",
    // ✅ Match apex here too
    url: "https://archpointlabs.com/",
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
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}