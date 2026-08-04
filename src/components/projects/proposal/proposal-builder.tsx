"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ProposalBuilder({ projectId, initialData, onComplete }: { projectId: string, initialData?: any, onComplete?: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "Project Proposal");
  const [scopeSummary, setScopeSummary] = useState(initialData?.scopeSummary || "");
  const [validityDays, setValidityDays] = useState("30");
  const [currency, setCurrency] = useState("INR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  
  const [lineItems, setLineItems] = useState<any[]>(
    initialData?.lineItems || [{ description: "", quantity: 1, unitPrice: 0 }]
  );

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleAddRow = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleChangeRow = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };

  const saveDraft = async () => {
    setIsSubmitting(true);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validityDays));

    const payload = {
      projectId,
      title,
      scopeSummary,
      price: calculateTotal(),
      currency,
      validUntil: validUntil.toISOString(),
      lineItems
    };

    try {
      if (initialData?.id) {
        await axios.patch('/api/proposals', { ...payload, proposalId: initialData.id, action: "update_draft" });
        toast.success("Draft updated");
      } else {
        await axios.post('/api/proposals', payload);
        toast.success("Draft proposal created");
      }
      router.refresh();
      if (onComplete) onComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendProposal = async () => {
    if (!initialData?.id) {
      toast.error("Please save as draft first before sending.");
      return;
    }
    setSendDialogOpen(false);
    setIsSubmitting(true);
    try {
      await axios.patch('/api/proposals', { proposalId: initialData.id, action: "send" });
      toast.success("Proposal sent to client!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6 bg-card border rounded-xl shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Proposal Builder</h2>
        <p className="text-sm text-muted-foreground mt-1">Create a detailed proposal for your client.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Proposal Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        
        <div className="space-y-2">
          <Label>Scope Summary</Label>
          <Textarea 
            value={scopeSummary} 
            onChange={e => setScopeSummary(e.target.value)} 
            rows={4} 
            placeholder="Summarize the project scope..." 
          />
        </div>

        <div className="space-y-4 pt-4">
          <Label>Line Items</Label>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left font-medium">Description</th>
                  <th className="p-3 text-right font-medium w-24">Qty</th>
                  <th className="p-3 text-right font-medium w-32">Unit Price</th>
                  <th className="p-3 text-right font-medium w-32">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <Input 
                        value={item.description} 
                        onChange={e => handleChangeRow(index, "description", e.target.value)} 
                        placeholder="e.g. Website Design" 
                        className="border-0 shadow-none focus-visible:ring-1"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => handleChangeRow(index, "quantity", parseInt(e.target.value) || 0)} 
                        className="text-right border-0 shadow-none focus-visible:ring-1"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={e => handleChangeRow(index, "unitPrice", parseInt(e.target.value) || 0)} 
                        className="text-right border-0 shadow-none focus-visible:ring-1"
                      />
                    </td>
                    <td className="p-2 text-right text-muted-foreground font-medium tabular-nums">
                      {currency} {(item.quantity * item.unitPrice).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleRemoveRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-muted/30 border-t">
              <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-xs">
                <Plus className="h-3 w-3 mr-2" /> Add Item
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <div className="text-xl font-semibold tracking-tight tabular-nums">
              Total: {currency} {calculateTotal().toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
           <div className="space-y-2 flex-1">
             <Label>Validity (Days)</Label>
             <Input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} />
           </div>
           <div className="space-y-2 flex-1">
             <Label>Currency</Label>
             <Input value={currency} onChange={e => setCurrency(e.target.value)} />
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button variant="outline" onClick={saveDraft} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </Button>
        {initialData?.id && (
          <Button onClick={() => setSendDialogOpen(true)} disabled={isSubmitting}>
             Send to Client
          </Button>
        )}
      </div>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this proposal to the client? You will not be able to edit it once sent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendProposal} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
