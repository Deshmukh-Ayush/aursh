"use client";

import { useEffect, useState } from "react";
import { Sparkle, Globe, CalendarBlank, Users } from "@phosphor-icons/react";

interface CreditSummaryData {
  organizationId: string;
  plan: string;
  aiCreditsUsed: number;
  aiCreditsAllotted: number;
  searchCreditsUsed: number;
  searchCreditsAllotted: number;
  periodStart: string;
  periodEnd: string;
  isSoftCap: boolean;
}

export function CreditUsageCard({ orgId }: { orgId?: string }) {
  const [data, setData] = useState<CreditSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCredits() {
      try {
        const res = await fetch("/api/organizations/credits");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.creditSummary && isMounted) {
            setData(json.creditSummary);
          }
        }
      } catch (err) {
        console.error("Failed to load credit usage:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCredits();
    return () => {
      isMounted = false;
    };
  }, [orgId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-3" />
        <div className="h-3 w-72 bg-muted/60 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-muted/40 rounded-lg" />
          <div className="h-20 bg-muted/40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Workspace Credit Pool
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
              <Users className="w-3 h-3" />
              Shared Pool
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pooled across all workspace members based on your {data.plan} plan capacity.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/30">
          <CalendarBlank className="w-3.5 h-3.5" />
          <span>
            {formatDate(data.periodStart)} – {formatDate(data.periodEnd)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Tool Calls */}
        <div className="p-4 rounded-lg border border-border/50 bg-background/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Sparkle className="w-3.5 h-3.5 text-primary" />
              AI Tool Actions
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {data.isSoftCap ? "Soft Cap" : "Hard Cap"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {data.aiCreditsUsed.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              / {data.aiCreditsAllotted.toLocaleString()} used
            </span>
          </div>
        </div>

        {/* Web Searches */}
        <div className="p-4 rounded-lg border border-border/50 bg-background/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Web Searches
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {data.isSoftCap ? "Soft Cap" : "Hard Cap"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {data.searchCreditsUsed.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              / {data.searchCreditsAllotted.toLocaleString()} used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
