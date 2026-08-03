import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Scrunity",
  description: "Read Scrunity's privacy policy to understand how we collect, use, and protect your personal, analytics, and financial information.",
};

export default function PrivacyPage() {
  return (
    <div className="dark flex min-h-svh flex-col bg-black text-foreground antialiased font-sans selection:bg-white/20">
      <header className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-stone-400 hover:text-stone-100 transition-colors">
          &larr; Back to Scrunity
        </Link>
        <span className="text-xs text-stone-500 font-mono">beta.scrunity.com</span>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-stone-300 leading-relaxed text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">1. Information We Collect</h2>
              <p>
                We collect personal, business, and usage information necessary to provide project management, contract signing, payment tracking, and platform analytics:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-stone-400">
                <li><strong className="text-stone-200">Account Credentials:</strong> Full name, email address, profile photo, and organization metadata.</li>
                <li><strong className="text-stone-200">Project & Legal Data:</strong> Uploaded contracts, Statements of Work, NDAs, deliverables, and discussion messages.</li>
                <li><strong className="text-stone-200">Audit & E-Signatures:</strong> IP addresses, timestamps, signature images, and SHA-256 document hashes for legal verification.</li>
                <li><strong className="text-stone-200">Payment Data:</strong> Billing contact details, payment milestone statuses, transaction IDs, and currency amounts.</li>
                <li><strong className="text-stone-200">Usage Analytics & Telemetry:</strong> Device type, browser type, page views, click interactions, and feature usage patterns via analytics providers (e.g. PostHog).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">2. Payment Processing & Merchant of Record</h2>
              <p>
                Subscription payments and milestone payment processing on Scrunity are securely facilitated by our Merchant of Record partner, <strong className="text-stone-100">Dodo Payments</strong>.
              </p>
              <p className="text-stone-400">
                When you make a payment or complete a milestone checkout on Scrunity, Dodo Payments collects and processes payment credentials (including Credit/Debit Card numbers, UPI IDs, or Netbanking details). Scrunity does not directly store full credit card numbers or sensitive banking credentials on our servers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">3. Analytics & Product Optimization</h2>
              <p className="text-stone-400">
                We use privacy-conscious analytics tools (such as PostHog) to understand how users interact with Scrunity, diagnose performance bottlenecks, and improve product workflows. This data is collected to optimize user experience and is never sold to third-party ad networks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">4. How We Use Your Information</h2>
              <p className="text-stone-400">
                We utilize collected information solely to facilitate project collaboration, generate legal audit logs, issue payment checkout links, deliver automated notifications, perform product analytics, and maintain platform security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">5. Data Storage & Security</h2>
              <p className="text-stone-400">
                We enforce industry-standard security measures including HTTPS/TLS encryption in transit, encrypted storage, and restricted database access to protect your documents and financial records against unauthorized access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">6. Third-Party Service Providers</h2>
              <p className="text-stone-400">
                We share data with trusted infrastructure providers (database hosting, document storage, email delivery via Resend, analytics via PostHog, and payment infrastructure via Dodo Payments) under strict data protection protocols.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">7. Contact & Support</h2>
              <p className="text-stone-400">
                For questions or data deletion requests regarding this Privacy Policy, please reach out to us at <a href="mailto:support@scrunity.com" className="text-stone-200 underline underline-offset-4">support@scrunity.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="px-6 py-6 border-t border-stone-800 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} Scrunity. All rights reserved.
      </footer>
    </div>
  );
}
