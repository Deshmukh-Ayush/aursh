import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scrunity — B2B Client Workspace",
  description: "Scrunity is a B2B client workspace for agencies and freelancers. Manage projects, proposals, contracts, and deliverables with your clients in one place.",
};

export default async function Page() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (session?.user) {
    redirect("/dashboard");
  }
  
  return (
    <div className="dark flex min-h-svh flex-col bg-background font-sans selection:bg-primary/20">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
