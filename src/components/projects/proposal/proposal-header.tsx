"use client";

import { Plus } from "lucide-react";

type ProposalHeaderProps = {
  isAgency: boolean;
  onOpenBuilder: () => void;
};

export function ProposalHeader({ isAgency, onOpenBuilder }: ProposalHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
      <div>
        <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
          Proposals
        </h1>
      </div>

      {isAgency && (
        <button
          onClick={onOpenBuilder}
          aria-label="Build new proposal"
          className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5 stroke-3" />
          <span>New Proposal</span>
        </button>
      )}
    </div>
  );
}
