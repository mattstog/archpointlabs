import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const siteUrl = "https://archpointlabs.com";
const siteDescription =
  "Archpoint Labs builds custom software, AI automations, workflow platforms, and data tools for businesses that need practical technology built around their operations.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Archpoint Labs | Custom Software, AI Automation & Workflow Platforms",
    template: "%s | Archpoint Labs",
  },
  description: siteDescription,
  keywords: [
    "custom software development",
    "AI automation",
    "business process automation",
    "workflow software",
    "AI implementation",
    "custom web applications",
    "data engineering",
    "custom software consultant",
    "custom software Texas",
    "AI automation consultant",
    "business automation consultant",
    "Dallas software consultant",
    "Matt Stogner",
    "Matthew Stogner",
    "Matt Stogner software",
    "Matthew Stogner software",
    "Archpoint Labs Matt Stogner",
    "Archpoint Labs Matthew Stogner",
    "Next.js developer",
    "Python automation",
  ],
  icons: {
    icon: "/logo-apl-favicon.svg",
    apple: "/sharing/apple-touch-icon-apl.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Archpoint Labs | Custom Software, AI Automation & Workflow Platforms",
    description: siteDescription,
    url: `${siteUrl}/`,
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
  twitter: {
    card: "summary_large_image",
    title: "Archpoint Labs | Custom Software, AI Automation & Workflow Platforms",
    description: siteDescription,
    images: ["/sharing/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Archpoint Labs",
      url: siteUrl,
      logo: `${siteUrl}/logo-apl-favicon.svg`,
      email: "matt@archpointlabs.com",
      founder: {
        "@type": "Person",
        name: "Matt Stogner",
        alternateName: "Matthew Stogner",
        jobTitle: "Founder and technical lead",
      },
      areaServed: [
        {
          "@type": "City",
          name: "Dallas",
          containedInPlace: {
            "@type": "State",
            name: "Texas",
          },
        },
        "Dallas-Fort Worth",
        "Texas",
        "United States",
      ],
      knowsAbout: [
        "Custom software development",
        "AI implementation",
        "Business process automation",
        "Workflow platforms",
        "Data engineering",
        "API integrations",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Archpoint Labs",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#professional-service`,
      name: "Archpoint Labs",
      url: siteUrl,
      email: "matt@archpointlabs.com",
      areaServed: [
        {
          "@type": "City",
          name: "Dallas",
          containedInPlace: {
            "@type": "State",
            name: "Texas",
          },
        },
        "Dallas-Fort Worth",
        "Texas",
        "United States",
      ],
      founder: {
        "@type": "Person",
        name: "Matt Stogner",
        alternateName: "Matthew Stogner",
      },
      serviceType: [
        "Custom software development",
        "AI automation",
        "Workflow software",
        "Data engineering",
        "API integrations",
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#services`,
      name: "Archpoint Labs services",
      itemListElement: [
        "Custom business software",
        "AI implementation and automation",
        "Workflow platforms",
        "Data engineering and reporting tools",
        "API integrations",
      ].map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
      })),
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
