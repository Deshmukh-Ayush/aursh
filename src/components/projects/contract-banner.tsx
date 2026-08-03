"use client";

import Link from "next/link";
import { AlertCircle, FileSignature, ArrowRight } from "lucide-react";

export function ContractBanner({ 
  projectId, 
  status, 
  role 
}: { 
  projectId: string; 
  status: "none" | "draft" | "pending_signature" | "signed"; 
  role: "owner" | "client" | "agency"; 
}) {
  if (status === "signed") return null;

  const isOwner = role === "owner";

  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-amber-500/[0.06] dark:bg-amber-500/[0.08] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)]">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 shrink-0 mt-0.5">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-300">
          {status === "none" ? "Contract not uploaded" : "Signatures pending"}
        </p>
        <p className="text-[12px] text-amber-800/70 dark:text-amber-400/60 leading-relaxed mt-0.5" style={{ textWrap: 'pretty' as any }}>
          {status === "none" 
            ? isOwner 
              ? "Upload a contract to formalize the agreement. The workspace is fully accessible in the meantime."
              : "The project owner hasn't uploaded a contract yet."
            : "Review and sign the contract to formally proceed."}
        </p>
      </div>
      <Link
        href={`/projects/${projectId}/contract`}
        className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors group mt-1"
      >
        <FileSignature className="w-3.5 h-3.5" />
        {status === "none" && isOwner ? "Upload" : "View"}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
