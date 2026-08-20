"use client";

import * as React from "react";
import { useTorch } from "./torch-context";
import { Sparkle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TorchHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export function TorchHeader({
  title = "Torch",
  subtitle,
  className,
  ...props
}: TorchHeaderProps) {
  const { orgName, loading } = useTorch();

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border/40 pb-3 px-1",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand border border-brand/20">
          <Flame className="h-4 w-4 text-brand" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {title}
            </h2>
            <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
              Agentic Co-Pilot
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {subtitle || `Grounded in ${orgName} workspace context`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            loading ? "bg-amber-500 animate-ping" : "bg-emerald-500",
          )}
        />
        <span>{loading ? "Reasoning & Executing..." : "Ready"}</span>
      </div>
    </div>
  );
}
