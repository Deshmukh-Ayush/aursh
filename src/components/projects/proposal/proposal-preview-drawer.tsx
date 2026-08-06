"use client";

import { Drawer } from "vaul";
import { ProposalClientView } from "./proposal-client-view";
import { useUIStore } from "@/store/ui-store";
import { useProposalStore } from "@/store/proposal-store";
import { useRouter } from "next/navigation";

interface ProposalPreviewDrawerProps {
  role: string;
}

export function ProposalPreviewDrawer({ role }: ProposalPreviewDrawerProps) {
  const router = useRouter();
  const isPreviewOpen = useUIStore((state) => state.isProposalPreviewOpen);
  const setProposalPreviewOpen = useUIStore((state) => state.setProposalPreviewOpen);
  const selectedProposal = useProposalStore((state) => state.selectedProposal);

  return (
    <Drawer.Root open={isPreviewOpen} onOpenChange={setProposalPreviewOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
          <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-4xl mx-auto w-full flex-1">
            <Drawer.Title className="sr-only">Proposal Details</Drawer.Title>
            <Drawer.Description className="sr-only">View project proposal details and line items</Drawer.Description>
            {selectedProposal && (
              <ProposalClientView
                proposal={selectedProposal}
                role={role}
                onAccepted={() => {
                  setProposalPreviewOpen(false);
                  router.refresh();
                }}
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
