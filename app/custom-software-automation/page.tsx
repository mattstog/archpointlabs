import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

const siteUrl = "https://archpointlabs.com"
const pageUrl = `${siteUrl}/custom-software-automation`

export const metadata: Metadata = {
  title: "Custom Software & AI Automation",
  description:
    "Archpoint Labs builds custom software, workflow automation, AI agents, data tools, and internal platforms for businesses that need practical technology.",
  alternates: {
    canonical: "/custom-software-automation",
  },
  openGraph: {
    title: "Custom Software & AI Automation | Archpoint Labs",
    description:
      "Custom web apps, AI automation, workflow platforms, and data tools for businesses with messy operational workflows.",
    url: pageUrl,
    siteName: "Archpoint Labs",
    images: [
      {
        url: "/sharing/og-image.png",
        width: 1200,
        height: 630,
        alt: "Archpoint Labs custom software and automation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Software & AI Automation | Archpoint Labs",
    description:
      "Custom software, AI automation, workflow platforms, and data tools for businesses with messy operational workflows.",
    images: ["/sharing/og-image.png"],
  },
}

const serviceSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${pageUrl}/#service`,
      name: "Custom software development and AI automation",
      url: pageUrl,
      provider: {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#professional-service`,
        name: "Archpoint Labs",
        url: siteUrl,
        email: "matt@archpointlabs.com",
        founder: {
          "@type": "Person",
          name: "Matt Stogner",
          alternateName: "Matthew Stogner",
          jobTitle: "Founder and technical lead",
        },
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
      serviceType: [
        "Custom software development",
        "AI automation",
        "Business process automation",
        "Workflow software",
        "Data engineering",
        "API integrations",
      ],
      description:
        "Archpoint Labs builds custom web applications, workflow automation, AI agents, data tools, and internal platforms for businesses that need practical technology around real operations.",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Custom Software and Automation",
          item: pageUrl,
        },
      ],
    },
  ],
}

const services = [
  "Custom web applications and internal tools",
  "AI agents for document-heavy business workflows",
  "Business process automation for manual, repetitive work",
  "Operational dashboards, reporting tools, and data pipelines",
  "API integrations between CRMs, databases, SaaS tools, and back-office systems",
  "Cloud deployment, production support, and practical technical leadership",
]

const examples = [
  {
    title: "Workflow platforms",
    body: "Replacing spreadsheet-driven processes with secure portals, role-based workflows, status tracking, document handling, and reporting.",
  },
  {
    title: "AI automation",
    body: "Using language models, OCR, document parsing, and structured extraction to reduce the time teams spend reading, routing, and re-keying information.",
  },
  {
    title: "Data and operations tools",
    body: "Building databases, dashboards, and integrations that make daily operations easier to see, manage, and improve.",
  },
]

export default function CustomSoftwareAutomationPage() {
  return (
    <main className="min-h-screen bg-[#2e353e] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 0%, rgba(239,56,46,0.14) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 85% 100%, rgba(239,56,46,0.28) 0%, transparent 45%), " +
            "#2e353e",
        }}
      />
      <div
        aria-hidden
        className="fixed top-0 inset-x-0 z-10 h-[3px]"
        style={{ background: "linear-gradient(to right, transparent, #ef382e 40%, #ef382e 60%, transparent)" }}
      />

      <div className="relative z-10">
        <nav className="flex items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center" aria-label="Archpoint Labs home">
            <Image
              src="/logos/AP Logo -White.svg"
              alt="Archpoint Labs"
              width={99}
              height={80}
              className="h-16 w-auto md:h-20"
              priority
            />
          </Link>
          <a
            href="https://calendar.app.google/Y7DRMz8GjakjuGf79"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#ef382e] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Book a Call
          </a>
        </nav>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-10 md:grid-cols-[0.95fr_1.05fr] md:pb-24 md:pt-16">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#ef382e]">
              Custom software and AI automation
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
              Custom software for business workflows that off-the-shelf tools cannot handle.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/72">
              Archpoint Labs helps businesses build practical software around the way their teams actually operate. Founded by Matt Stogner, Archpoint builds internal tools, workflow platforms, AI automations, dashboards, and integrations for companies that have outgrown spreadsheets or disconnected software.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[#ef382e] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Chat with Milo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div key={service} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#ef382e]" />
                <p className="text-sm leading-relaxed text-white/75">{service}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Built for operations, not just demos.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/70">
                The best custom software projects usually start with a business process that is too important to keep running manually. We map the workflow, identify where automation actually saves time, and build the smallest reliable platform that can grow with the operation.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {examples.map((example) => (
                <article key={example.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-bold">{example.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{example.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#ef382e]">
                Good fit
              </p>
              <h2 className="text-3xl font-extrabold leading-tight">When custom software makes sense</h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-white/72">
              <p>
                Custom software is usually worth exploring when your team is doing high-value work through spreadsheets, email chains, copy-paste steps, disconnected databases, or manual review queues.
              </p>
              <p>
                Archpoint Labs is especially strong when a project combines operations, data, and AI: document processing, workflow routing, reporting, ownership or claims review, internal portals, and systems that need to connect several tools into one reliable process.
              </p>
              <p>
                If the project needs a technical partner who can understand the messy business reality first and then build the right software around it, that is the lane Matt and Archpoint Labs like to work in.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
