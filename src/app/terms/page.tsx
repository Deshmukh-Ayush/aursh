import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Scrunity",
  description: "Read Scrunity's terms of service governing subscription plans, payment milestones, e-signatures, and platform usage.",
};

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-stone-300 leading-relaxed text-sm md:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">1. Acceptance & Description of Service</h2>
              <p className="text-stone-400">
                Scrunity ("the Service", hosted at <strong className="text-stone-200">beta.scrunity.com</strong>) is a client collaboration and revenue management platform for agencies, freelancers, and clients. By creating an account or accessing the Service, you agree to these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">2. Merchant of Record & Billing Terms</h2>
              <p>
                All online SaaS subscription billing (Free, Freelancer, Agency tiers) and milestone payment checkouts are powered and billed by our Merchant of Record partner, <strong className="text-stone-100">Dodo Payments</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-stone-400">
                <li>Dodo Payments handles payment authorization, invoice issuance, sales tax/GST compliance, and currency settlement.</li>
                <li>Subscriptions auto-renew monthly unless cancelled prior to the renewal date via Organization Settings.</li>
                <li>Prices are displayed in USD or INR as specified at checkout.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">3. Refund & Cancellation Policy</h2>
              <p className="text-stone-300">
                We strive to ensure complete satisfaction with Scrunity:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-stone-400">
                <li><strong className="text-stone-200">14-Day Money-Back Guarantee:</strong> If you are unsatisfied with a paid subscription plan within 14 days of initial upgrade, contact <a href="mailto:support@scrunity.com" className="text-stone-200 underline underline-offset-4">support@scrunity.com</a> for a full refund.</li>
                <li><strong className="text-stone-200">Subscription Cancellation:</strong> You can cancel your subscription at any time. Your access will remain active through the end of your current billing period.</li>
                <li><strong className="text-stone-200">Milestone Payments:</strong> Client-to-agency milestone funds are governed by the specific project contract and deliverable acceptance terms agreed between the Agency and Client.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">4. Electronic Signatures & Contracts</h2>
              <p className="text-stone-400">
                Scrunity facilitates electronic signature execution for Statements of Work, NDAs, and project agreements. By executing a signature on Scrunity, you affirm that your electronic signature is legally binding and enforceable under applicable electronic transaction laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">5. User Accounts & Responsibilities</h2>
              <p className="text-stone-400">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account. You agree not to upload fraudulent, illegal, or unauthorized content.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">6. Contact Information</h2>
              <p className="text-stone-400">
                For questions regarding these Terms or billing inquiries, contact us at <a href="mailto:support@scrunity.com" className="text-stone-200 underline underline-offset-4">support@scrunity.com</a>.
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
