"use client";

import type { AIDrawerTab } from "@/store/ai-store";
import type { ContractScope } from "@/lib/ai/schemas";
import { CheckCircle2Icon, XCircleIcon, ShieldAlertIcon, CreditCardIcon } from "lucide-react";

interface ContractAIDrawerContentProps {
  activeTab: AIDrawerTab;
  terms: ContractScope;
}

export function ContractAIDrawerContent({ activeTab, terms }: ContractAIDrawerContentProps) {
  if (activeTab === "scope") {
    if (terms.scopeItems.length === 0) {
      return <EmptyState text="No explicitly stated scope items extracted." />;
    }
    return (
      <div className="space-y-3">
        {terms.scopeItems.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 dark:bg-emerald-500/10"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "exclusions") {
    if (terms.exclusions.length === 0) {
      return <EmptyState text="No explicit out-of-scope exclusions found." />;
    }
    return (
      <div className="space-y-3">
        {terms.exclusions.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 dark:bg-rose-500/10"
          >
            <div className="flex items-start gap-2.5">
              <XCircleIcon className="mt-0.5 h-4 w-4 text-rose-500 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "revisions") {
    if (terms.revisionLimits.length === 0) {
      return <EmptyState text="No revision limits found in contract terms." />;
    }
    return (
      <div className="space-y-3">
        {terms.revisionLimits.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 dark:bg-amber-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlertIcon className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                  {item.description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                Max {item.maxRevisions}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "payment") {
    if (terms.paymentTerms.length === 0) {
      return <EmptyState text="No specific payment terms extracted." />;
    }
    return (
      <div className="space-y-3">
        {terms.paymentTerms.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 dark:bg-sky-500/10"
          >
            <div className="flex items-start gap-2.5">
              <CreditCardIcon className="mt-0.5 h-4 w-4 text-sky-500 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
