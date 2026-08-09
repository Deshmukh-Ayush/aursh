"use client";

import type { AIDrawerTab } from "@/store/ai-store";
import { CheckCircle2Icon, XCircleIcon, AlertTriangleIcon, CreditCardIcon } from "lucide-react";

interface ContractAIDrawerTabsProps {
  activeTab: AIDrawerTab;
  onTabChange: (tab: AIDrawerTab) => void;
  scopeCount: number;
  exclusionsCount: number;
  revisionsCount: number;
  paymentCount: number;
}

export function ContractAIDrawerTabs({
  activeTab,
  onTabChange,
  scopeCount,
  exclusionsCount,
  revisionsCount,
  paymentCount,
}: ContractAIDrawerTabsProps) {
  const tabs: Array<{
    id: AIDrawerTab;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      id: "scope",
      label: "In-Scope",
      count: scopeCount,
      icon: <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />,
    },
    {
      id: "exclusions",
      label: "Out-of-Scope",
      count: exclusionsCount,
      icon: <XCircleIcon className="h-3.5 w-3.5 text-rose-500" />,
    },
    {
      id: "revisions",
      label: "Revision Limits",
      count: revisionsCount,
      icon: <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500" />,
    },
    {
      id: "payment",
      label: "Payment Terms",
      count: paymentCount,
      icon: <CreditCardIcon className="h-3.5 w-3.5 text-sky-500" />,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/40 pb-3 pt-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                isActive ? "bg-background/20 text-background" : "bg-muted-foreground/10 text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
