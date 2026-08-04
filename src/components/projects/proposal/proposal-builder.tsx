"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Send, Save, Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProposalBuilder({
  projectId,
  initialData,
  onComplete,
}: {
  projectId: string;
  initialData?: any;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "Project Scope Proposal");
  const [scopeSummary, setScopeSummary] = useState(initialData?.scopeSummary || "");
  const [validityDays, setValidityDays] = useState("30");
  const [currency, setCurrency] = useState("INR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lineItems, setLineItems] = useState<any[]>(
    initialData?.lineItems || [
      { description: "UI/UX Design & Prototyping", quantity: 1, unitPrice: 25000 },
      { description: "Full-Stack Development & API Integration", quantity: 1, unitPrice: 50000 },
    ]
  );

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  };

  const formatCurrency = (amount: number, curr: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: curr || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddRow = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (lineItems.length <= 1) {
      toast.error("Proposals must contain at least 1 line item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleChangeRow = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };

  const handleSave = async (shouldSend: boolean = false) => {
    if (!title.trim()) {
      toast.error("Please enter a proposal title.");
      return;
    }

    const invalidItem = lineItems.find((item) => !item.description.trim() || item.unitPrice <= 0);
    if (invalidItem) {
      toast.error("Please provide valid descriptions and positive prices for all line items.");
      return;
    }

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
      lineItems,
    };

    try {
      let createdOrUpdatedId = initialData?.id;

      if (initialData?.id) {
        await axios.patch("/api/proposals", { ...payload, proposalId: initialData.id, action: "update_draft" });
        toast.success("Proposal updated");
      } else {
        const res = await axios.post("/api/proposals", payload);
        createdOrUpdatedId = res.data.proposalId;
        toast.success("Draft proposal created");
      }

      if (shouldSend && createdOrUpdatedId) {
        await axios.patch("/api/proposals", { proposalId: createdOrUpdatedId, action: "send" });
        toast.success("Proposal sent to client!");
      }

      router.refresh();
      if (onComplete) onComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Overview Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Line items added below will automatically convert into project deliverables and milestone payment release triggers when accepted by your client.
        </p>
      </div>

      {/* Main Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Proposal Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign & Mobile App Scope"
            className="h-10 bg-background border-border/60 text-sm font-semibold focus-visible:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 w-full rounded-md border border-border/60 bg-background px-3 py-1 text-xs text-foreground font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary/20"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Validity</Label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="h-10 w-full rounded-md border border-border/60 bg-background px-3 py-1 text-xs text-foreground font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary/20"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Scope Summary (Optional)</Label>
        <Textarea
          value={scopeSummary}
          onChange={(e) => setScopeSummary(e.target.value)}
          placeholder="Briefly describe the overall scope, goals, deliverables, and timeline commitments..."
          rows={3}
          className="bg-background border-border/60 text-xs leading-relaxed focus-visible:ring-primary/20"
        />
      </div>

      {/* Line Items Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scope Line Items & Deliverables
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-border/30">
            {lineItems.map((item, idx) => (
              <div key={idx} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:bg-muted/20 transition-colors">
                <div className="sm:col-span-6 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase sm:hidden">Description</span>
                  <Input
                    value={item.description}
                    onChange={(e) => handleChangeRow(idx, "description", e.target.value)}
                    placeholder="e.g. Landing Page UI Design"
                    className="h-9 text-xs bg-background/80 border-border/40"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase sm:hidden">Qty</span>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleChangeRow(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9 text-xs bg-background/80 border-border/40 text-center tabular-nums"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase sm:hidden">Unit Price ({currency})</span>
                  <Input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleChangeRow(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs bg-background/80 border-border/40 text-right tabular-nums"
                  />
                </div>

                <div className="sm:col-span-1 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRow(idx)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 active:scale-[0.96] transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-muted/30 border-t border-border/40 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs h-8 px-3 font-medium active:scale-[0.96] transition-transform"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Line Item
            </Button>

            <div className="text-right">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mr-3">Subtotal:</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatCurrency(calculateTotal(), currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Total Investment
          </span>
          <span className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
            {formatCurrency(calculateTotal(), currency)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
            className="text-xs h-9 px-4 active:scale-[0.96] transition-transform"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(true)}
            className="text-xs h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium active:scale-[0.96] transition-transform shadow-md"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Save & Send to Client
          </Button>
        </div>
      </div>
    </div>
  );
}
