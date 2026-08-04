"use client";

import Link from "next/link";
import { Sparkles, FileText, FileSignature, CheckCircle2, ArrowRight, Layers, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectOnboardingStepperProps {
  projectId: string;
  hasProposal: boolean;
  hasContract: boolean;
  hasDeliverables: boolean;
  userRole: string;
}

export function ProjectOnboardingStepper({
  projectId,
  hasProposal,
  hasContract,
  hasDeliverables,
  userRole,
}: ProjectOnboardingStepperProps) {
  // If project already has scope setup (contract signed, proposal accepted, or deliverables exist), don't show the onboarding stepper
  if (hasDeliverables || (hasProposal && hasContract)) {
    return null;
  }

  const steps = [
    {
      num: "1",
      title: "Create Scope",
      desc: "Build a proposal or upload a contract PDF",
      active: !hasProposal && !hasContract,
      completed: hasProposal || hasContract,
    },
    {
      num: "2",
      title: "Client Agreement",
      desc: "Client accepts proposal or signs contract online",
      active: (hasProposal || hasContract) && !hasDeliverables,
      completed: hasDeliverables,
    },
    {
      num: "3",
      title: "Scope Auto-Mapping",
      desc: "Deliverables & payment milestones are generated",
      active: false,
      completed: hasDeliverables,
    },
    {
      num: "4",
      title: "Delivery & Payment",
      desc: "Review work and release milestone payments",
      active: false,
      completed: false,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/40 p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Project Setup Guide
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Welcome to your project workspace!
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Start by creating a proposal or uploading a contract. Once agreed upon, Scrunity automatically maps deliverables and payment milestones for you.
          </p>
        </div>

        {(userRole === "owner" || userRole === "agency") && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/projects/${projectId}/proposal`}>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4 font-medium active:scale-[0.96] transition-transform">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Build Proposal
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/contract`}>
              <Button size="sm" variant="outline" className="text-xs h-9 px-4 font-medium active:scale-[0.96] transition-transform">
                <FileSignature className="w-3.5 h-3.5 mr-1.5" /> Upload Contract
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
              s.completed
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : s.active
                ? "bg-background border-primary/40 shadow-xs text-foreground"
                : "bg-muted/30 border-border/30 text-muted-foreground"
            }`}
          >
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                s.completed
                  ? "bg-emerald-500 text-white"
                  : s.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.completed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-semibold leading-none text-foreground flex items-center justify-between">
                <span>{s.title}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground hidden lg:block" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
