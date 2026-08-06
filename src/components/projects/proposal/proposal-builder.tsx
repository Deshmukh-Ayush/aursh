"use client";

import { Trash2, Plus, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProposalStore } from "@/store/proposal-store";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProposalBuilderProps {
  projectId: string;
  onComplete?: () => void;
}

export function ProposalBuilder({ projectId, onComplete }: ProposalBuilderProps) {
  const router = useRouter();

  const title = useProposalStore((state) => state.title);
  const scopeSummary = useProposalStore((state) => state.scopeSummary);
  const validityDays = useProposalStore((state) => state.validityDays);
  const currency = useProposalStore((state) => state.currency);
  const lineItems = useProposalStore((state) => state.lineItems);
  const isSubmitting = useProposalStore((state) => state.isSubmitting);

  const setTitle = useProposalStore((state) => state.setTitle);
  const setScopeSummary = useProposalStore((state) => state.setScopeSummary);
  const setValidityDays = useProposalStore((state) => state.setValidityDays);
  const setCurrency = useProposalStore((state) => state.setCurrency);
  const setIsSubmitting = useProposalStore((state) => state.setIsSubmitting);
  const addLineItem = useProposalStore((state) => state.addLineItem);
  const removeLineItem = useProposalStore((state) => state.removeLineItem);
  const updateLineItem = useProposalStore((state) => state.updateLineItem);
  const resetBuilder = useProposalStore((state) => state.resetBuilder);

  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("Proposal title is required");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    try {
      setIsSubmitting(true);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (parseInt(validityDays) || 30));

      const payload = {
        projectId,
        title,
        scopeSummary,
        validUntil: validUntil.toISOString(),
        currency,
        price: subtotal,
        status: "draft",
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        })),
      };

      const res = await axios.post("/api/proposals", payload);
      if (res.data.success) {
        toast.success("Draft proposal created!");
        resetBuilder();
        if (onComplete) onComplete();
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proposal General Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-semibold">Proposal Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign & Brand Identity Scope"
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-semibold">Scope Summary / Overview</Label>
          <Textarea
            value={scopeSummary}
            onChange={(e) => setScopeSummary(e.target.value)}
            placeholder="Briefly describe the key goals, deliverables, and terms of this estimate..."
            rows={2}
            className="text-xs leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Validity Period (Days)</Label>
          <Input
            type="number"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            placeholder="30"
            className="h-10 text-xs tabular-nums"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Currency</Label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-lg border border-border/60 bg-background focus:outline-hidden"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Scope Line Items & Breakdown
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={addLineItem}
            className="h-8 text-xs px-3 active:scale-[0.96] transition-transform"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {lineItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/40">
              <Input
                value={item.description}
                onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                placeholder="Item description / deliverable title"
                className="flex-1 h-9 text-xs"
              />
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))}
                placeholder="Qty"
                className="w-16 h-9 text-xs text-center tabular-nums"
              />
              <Input
                type="number"
                min="0"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(idx, "unitPrice", Number(e.target.value))}
                placeholder="Price"
                className="w-28 h-9 text-xs text-right tabular-nums"
              />
              <div className="w-24 text-right text-xs font-semibold tabular-nums shrink-0 px-2">
                {formatCurrency(item.quantity * item.unitPrice)}
              </div>
              {lineItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(idx)}
                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-[0.96] transition-transform shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Total & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div>
          <span className="text-xs text-muted-foreground font-medium block">Total Estimate Price</span>
          <span className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
        </div>

        <Button
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs h-9 px-5 active:scale-[0.96] transition-transform flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? "Saving..." : "Save Draft Proposal"}
        </Button>
      </div>
    </div>
  );
}
