"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ProposalClientView({ proposal, role, onAccepted }: { proposal: any, role: string, onAccepted?: () => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: "accept" | "decline" | null }>({ isOpen: false, action: null });

  const executeAction = async () => {
    if (!confirmDialog.action) return;
    
    setIsSubmitting(true);
    setConfirmDialog({ isOpen: false, action: null });
    
    try {
      await axios.patch('/api/proposals', { proposalId: proposal.id, action: confirmDialog.action });
      toast.success(`Proposal ${confirmDialog.action}ed successfully`);
      router.refresh();
      if (onAccepted) onAccepted();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${confirmDialog.action} proposal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = new Date(proposal.validUntil) < new Date();
  const validityText = isExpired 
    ? "Expired" 
    : `Valid for ${formatDistanceToNow(new Date(proposal.validUntil))}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border rounded-xl shadow-sm">
         <div>
           <div className="flex items-center gap-3 mb-2">
             <h1 className="text-2xl font-bold tracking-tight">{proposal.title}</h1>
             <Badge variant={proposal.status === 'accepted' ? 'default' : proposal.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">
               {proposal.status}
             </Badge>
           </div>
           <p className="text-sm text-muted-foreground flex gap-4">
             <span>Created {new Date(proposal.createdAt).toLocaleDateString()}</span>
             {proposal.status === 'sent' && (
               <span className={isExpired ? "text-destructive font-medium" : ""}>
                 {validityText}
               </span>
             )}
           </p>
         </div>
         
         <div className="text-right">
           <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
           <div className="text-3xl font-bold tracking-tight text-primary tabular-nums">
             {proposal.currency} {proposal.price.toLocaleString()}
           </div>
         </div>
      </div>

      {/* Scope */}
      <div className="p-6 bg-card border rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Scope of Work</h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {proposal.scopeSummary || "No summary provided."}
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6 bg-card border rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Investment Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3 text-left font-medium border-b">Description</th>
                <th className="py-3 text-right font-medium border-b">Qty</th>
                <th className="py-3 text-right font-medium border-b">Unit Price</th>
                <th className="py-3 text-right font-medium border-b">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {proposal.lineItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-4 text-foreground">{item.description}</td>
                  <td className="py-4 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                  <td className="py-4 text-right tabular-nums text-muted-foreground">
                    {proposal.currency} {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-4 text-right tabular-nums font-medium text-foreground">
                    {proposal.currency} {item.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-4 text-right font-semibold">Grand Total:</td>
                <td className="py-4 text-right font-bold text-lg tabular-nums text-primary">
                   {proposal.currency} {proposal.price.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions (Client Only) */}
      {role === 'client' && proposal.status === 'sent' && !isExpired && (
        <div className="flex gap-4 justify-end p-6 bg-primary/5 border border-primary/20 rounded-xl">
          <Button variant="outline" size="lg" className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmDialog({ isOpen: true, action: 'decline' })} disabled={isSubmitting}>
            Decline Proposal
          </Button>
          <Button size="lg" onClick={() => setConfirmDialog({ isOpen: true, action: 'accept' })} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Accept & Continue
          </Button>
        </div>
      )}
      
      {/* Expiry Warning */}
      {proposal.status === 'sent' && isExpired && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-center rounded-xl font-medium">
          This proposal has expired. Please contact the project owner for a revised version.
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
               {confirmDialog.action === 'accept' ? 'Accept Proposal' : 'Decline Proposal'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.action} this proposal? 
              {confirmDialog.action === 'accept' ? ' This will automatically generate the project deliverables.' : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, action: null })}>Cancel</Button>
            <Button 
               variant={confirmDialog.action === 'decline' ? 'destructive' : 'default'} 
               onClick={executeAction}
               disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
