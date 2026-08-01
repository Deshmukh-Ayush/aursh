import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read Scrunity's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="dark flex min-h-svh flex-col bg-black text-foreground antialiased font-sans selection:bg-white/20">
      <header className="px-6 py-4 border-b border-stone-800">
        <Link href="/" className="text-sm font-medium text-stone-400 hover:text-stone-100 transition-colors">
          &larr; Back to Scrunity
        </Link>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email address, profile details).</li>
                <li>Project data, uploaded files, and deliverables.</li>
                <li>Electronic signature records and associated metadata.</li>
                <li>Communication and comments within the platform.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve Scrunity. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Facilitating the signing and storage of contracts.</li>
                <li>Sending you technical notices, updates, and security alerts.</li>
                <li>Responding to your comments, questions, and customer service requests.</li>
                <li>Monitoring and analyzing trends, usage, and activities in connection with our Service.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">3. Data Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure, and we cannot guarantee the absolute security of your data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">4. Third-Party Services</h2>
              <p>
                We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., hosting providers, email delivery services). These third parties are bound by strict confidentiality agreements.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">5. Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data. You may update your account information at any time by logging into your account settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at support@scrunity.sh.
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
