import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { DashboardNeedsAttentionItem } from "@/types/dash-types";

interface NeedsAttentionProps {
  items: DashboardNeedsAttentionItem[];
}

export function NeedsAttention({ items }: NeedsAttentionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Needs Attention
      </h3>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <div className="flex items-center gap-3 rounded-lg border bg-amber-500/10 p-3 text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">{item.projectName}</span>
                <span className="opacity-80"> — {item.message}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}