"use client";

import { Drawer } from "vaul";
import { ProposalBuilder } from "./proposal-builder";
import { useUIStore } from "@/store/ui-store";

interface ProposalBuilderDrawerProps {
  projectId: string;
}

export function ProposalBuilderDrawer({ projectId }: ProposalBuilderDrawerProps) {
  const isBuilderOpen = useUIStore((state) => state.isProposalBuilderOpen);
  const setProposalBuilderOpen = useUIStore((state) => state.setProposalBuilderOpen);

  return (
    <Drawer.Root open={isBuilderOpen} onOpenChange={setProposalBuilderOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
          <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-4xl mx-auto w-full flex-1">
            <Drawer.Title className="text-xl font-bold text-foreground">Build Project Proposal</Drawer.Title>
            <Drawer.Description className="text-xs text-muted-foreground mb-6">
              Define line items & scope for this project. Line items will automatically become deliverables & payment milestones upon client acceptance.
            </Drawer.Description>
            <ProposalBuilder projectId={projectId} onComplete={() => setProposalBuilderOpen(false)} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
