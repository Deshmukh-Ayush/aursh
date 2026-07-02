import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  return (
    <div className="dark flex min-h-svh flex-col bg-background font-sans selection:bg-primary/20">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 md:py-40">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Scrunity ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">2. Description of Service</h2>
              <p>
                Scrunity is a client collaboration platform that allows agencies, freelancers, and their clients to manage projects, sign agreements, and track deliverables. The Service is provided "as is" and "as available".
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">3. User Accounts and Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate information when creating an account.</li>
                <li>You are responsible for safeguarding your account credentials.</li>
                <li>You must immediately notify us of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">4. Electronic Signatures and Contracts</h2>
              <p>
                The Service facilitates the execution of electronic signatures. By using the Service to sign documents, you agree that your electronic signature is legally binding and equivalent to your handwritten signature. You are solely responsible for ensuring that electronic signatures are valid and enforceable for your specific use cases under applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">5. User Content and Data</h2>
              <p>
                You retain all rights to the data, documents, and content you upload to Scrunity. By uploading content, you grant Scrunity a license to host, store, and process this content solely for the purpose of providing the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Scrunity shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the Service.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
