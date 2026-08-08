"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  FileText, 
  Upload, 
  CheckCircle2,
  AlertCircle, 
  Flag,
  UserPlus,
  Play,
  Receipt,
  Activity,
  Search,
  Filter
} from "lucide-react";
import { SealCheckIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

type LogItem = {
  log: {
    id: string;
    projectId: string;
    userId: string | null;
    type: string;
    metadata: unknown;
    createdAt: Date;
  };
  actor: {
    name: string | null;
  } | null;
};

type ActivityLogClientProps = {
  logs: LogItem[];
};

const CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "contract", label: "Contracts & E-Sign" },
  { id: "payment", label: "Payments" },
  { id: "scope", label: "Deliverables & Scope" },
  { id: "file", label: "Files & Uploads" },
  { id: "member", label: "Team & Members" },
];

export function ActivityLogClient({ logs }: ActivityLogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getActivityConfig = (type: string, metadata: Record<string, unknown>) => {
    switch (type) {
      case "contract_uploaded":
        return { 
          Icon: FileText, 
          color: "text-sky-500", 
          text: `Uploaded contract (${metadata?.fileName || "Document"})`,
          category: "Contract",
          catKey: "contract"
        };
      case "contract_signed":
        return { 
          Icon: SealCheckIcon, 
          color: "text-emerald-500", 
          text: metadata?.fullySigned ? "Signed contract (Fully Executed)" : "Signed contract",
          category: "E-Sign",
          catKey: "contract"
        };
      case "payment_completed":
        return {
          Icon: Receipt,
          color: "text-emerald-500",
          text: `Verified payment receipt for ${metadata?.milestoneTitle || "Milestone"}`,
          category: "Payment",
          catKey: "payment"
        };
      case "file_uploaded":
        return { 
          Icon: Upload, 
          color: "text-purple-500", 
          text: `Uploaded file (${metadata?.fileName || "Attachment"})`,
          category: "File",
          catKey: "file" 
        };
      case "deliverable_created":
        return { 
          Icon: Play, 
          color: "text-sky-500", 
          text: `Created deliverable: ${metadata?.title || "Task"}`,
          category: "Scope",
          catKey: "scope" 
        };
      case "deliverable_in_review":
        return { 
          Icon: PaperPlaneTiltIcon, 
          color: "text-sky-500", 
          text: `Submitted deliverable for review: ${metadata?.title || "Task"}`,
          category: "Review",
          catKey: "scope" 
        };
      case "deliverable_approved":
        return { 
          Icon: CheckCircle2, 
          color: "text-emerald-500", 
          text: `Approved deliverable: ${metadata?.title || "Task"}`,
          category: "Approval",
          catKey: "scope" 
        };
      case "revision_requested":
        return { 
          Icon: AlertCircle, 
          color: "text-rose-500 animate-pulse", 
          text: `Requested revision on: ${metadata?.title || "Task"}${metadata?.comment ? `. Reason: ${metadata?.comment}` : ""}`,
          category: "Revision",
          catKey: "scope" 
        };
      case "project_completed":
        return { 
          Icon: Flag, 
          color: "text-emerald-500", 
          text: "Marked project as completed!",
          category: "Milestone",
          catKey: "scope" 
        };
      case "member_joined":
        return { 
          Icon: UserPlus, 
          color: "text-purple-500", 
          text: "Joined the project team",
          category: "Member",
          catKey: "member" 
        };
      default:
        return { 
          Icon: Activity, 
          color: "text-muted-foreground", 
          text: "Performed an action",
          category: "Audit",
          catKey: "all" 
        };
    }
  };

  const filteredLogs = logs.filter(({ log, actor }) => {
    const metadata = (log.metadata as Record<string, unknown>) || {};
    const config = getActivityConfig(log.type, metadata);

    // Category filter
    if (selectedCategory !== "all" && config.catKey !== selectedCategory) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (actor?.name || "").toLowerCase();
      const text = config.text.toLowerCase();
      const cat = config.category.toLowerCase();
      return name.includes(q) || text.includes(q) || cat.includes(q);
    }

    return true;
  });

  return (
    <section aria-label="Project Audit Trail" className="space-y-4">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground text-balance">
            All Recorded Audit Events (<span className="tabular-nums">{filteredLogs.length}</span>)
          </h2>
        </div>

        {/* Right Controls: Search Input + Category Selector */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative flex items-center min-w-40 sm:min-w-48">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium"
            />
          </div>

          {/* Category Select Dropdown */}
          <div className="relative flex items-center shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-full border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Event List */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
          <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground tracking-tight text-balance">No Matching Audit Events</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed text-pretty">
            {searchQuery || selectedCategory !== "all"
              ? "No events match your search query or filter selection."
              : "All project actions, payment verifications, scope approvals, and uploads will be logged here."}
          </p>
        </div>
      ) : (
        <div>
          {filteredLogs.map(({ log, actor }) => {
            const metadata = (log.metadata as Record<string, unknown>) || {};
            const config = getActivityConfig(log.type, metadata);
            const EventIcon = config.Icon;
            const dateObj = new Date(log.createdAt);

            return (
              <div
                key={log.id}
                className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors rounded-md"
              >
                {/* Left: Icon, User Name, Description & Category Badge */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <EventIcon className={`w-4 h-4 shrink-0 ${config.color}`} />

                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold tracking-tight text-foreground shrink-0">
                      {actor?.name || "System"}
                    </span>
                    <span className="text-xs text-muted-foreground text-pretty truncate max-w-xs sm:max-w-md">
                      {config.text}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-muted/60 text-muted-foreground border border-border/30 shrink-0 ml-auto sm:ml-0">
                    {config.category}
                  </span>
                </div>

                {/* Right: Timestamp */}
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0 ml-7 sm:ml-0">
                  <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap" title={format(dateObj, "yyyy-MM-dd HH:mm:ss")}>
                    {formatDistanceToNow(dateObj, { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
