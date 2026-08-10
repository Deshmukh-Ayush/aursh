"use client";

import { useState } from "react";
import { Trash2, Plus, FileText, CheckCircle2, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProposalStore } from "@/store/proposal-store";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ThinkingOrb } from "thinking-orbs";

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

  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPreset, setAiPreset] = useState("web_app");

  const handleAiSmartDraft = async (presetType: string) => {
    setIsAiDrafting(true);
    toast.info("Scrunity AI is generating SOW & line items...");

    // Simulate AI generation with thinking orb feel
    await new Promise((r) => setTimeout(r, 1800));

    if (presetType === "web_app") {
      setTitle("Full-Stack Web Application Development SOW");
      setScopeSummary(
        "End-to-end full-stack web application development including system architecture, reactive UI components, database schemas, secure API integrations, and CI/CD deployment pipeline."
      );
      useProposalStore.setState({
        lineItems: [
          { id: crypto.randomUUID(), description: "Core System Architecture, DB Schema & Tech Stack Setup", quantity: 1, unitPrice: 50000 },
          { id: crypto.randomUUID(), description: "Responsive UI/UX Component Engineering & State Management", quantity: 1, unitPrice: 75000 },
          { id: crypto.randomUUID(), description: "Backend REST API Endpoints & Auth Access Control", quantity: 1, unitPrice: 65000 },
          { id: crypto.randomUUID(), description: "QA End-to-End Testing, Security Auditing & Vercel Deployment", quantity: 1, unitPrice: 30000 },
        ],
      });
    } else if (presetType === "brand_design") {
      setTitle("Brand Identity & UI/UX Design System SOW");
      setScopeSummary(
        "Comprehensive branding identity development, logo system, typography scales, Figma design tokens, and interactive high-fidelity user interface prototypes."
      );
      useProposalStore.setState({
        lineItems: [
          { id: crypto.randomUUID(), description: "Brand Identity, Logo System & Color Tokens", quantity: 1, unitPrice: 45000 },
          { id: crypto.randomUUID(), description: "Figma High-Fidelity Desktop & Mobile UI Component System", quantity: 1, unitPrice: 65000 },
          { id: crypto.randomUUID(), description: "Interactive User Flow Prototypes & Usability Testing", quantity: 1, unitPrice: 30000 },
        ],
      });
    } else if (presetType === "mobile_app") {
      setTitle("Cross-Platform Mobile App MVP SOW");
      setScopeSummary(
        "Native mobile application MVP development for iOS and Android, cloud backend API endpoints, user authentication, push notifications, and App Store submission."
      );
      useProposalStore.setState({
        lineItems: [
          { id: crypto.randomUUID(), description: "Cross-Platform React Native App Architecture (iOS & Android)", quantity: 1, unitPrice: 120000 },
          { id: crypto.randomUUID(), description: "Cloud API Backend, Push Notifications & User Auth", quantity: 1, unitPrice: 55000 },
          { id: crypto.randomUUID(), description: "App Store & Google Play Store Publishing & Compliance", quantity: 1, unitPrice: 25000 },
        ],
      });
    }

    setIsAiDrafting(false);
    setShowAiModal(false);
    toast.success("✨ SOW & line items auto-drafted by Scrunity AI!");
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Draft Action Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-[#00AAF7]/30 bg-gradient-to-r from-[#00AAF7]/10 via-[#8B5CF6]/10 to-transparent p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ThinkingOrb state="weaving" size={20} theme="auto" />
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Scrunity AI Smart Draft</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00AAF7]/20 text-[#00AAF7] uppercase tracking-wider">
                AI Auto-Fill
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Auto-generate structured SOW, line items, and pricing estimates in seconds
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowAiModal(true)}
          disabled={isAiDrafting}
          className="bg-gradient-to-r from-[#00AAF7] to-[#0284C7] text-white hover:opacity-95 text-xs font-semibold px-4 py-2 rounded-xl shadow-md"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          <span>Auto-Draft SOW</span>
        </Button>
      </div>

      {/* AI Smart Draft Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-background p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <ThinkingOrb state="weaving" size={20} theme="auto" />
                <h3 className="text-sm font-bold text-foreground">Scrunity AI SOW Generator</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isAiDrafting ? (
              <div className="py-10 flex flex-col items-center justify-center gap-4 text-center">
                <ThinkingOrb state="composing" size={64} theme="auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Scrunity AI Generating SOW...</p>
                  <p className="text-[11px] t-shimmer" data-text="Synthesizing scope summary & line items...">
                    Synthesizing scope summary &amp; line items...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a project scope template for Scrunity AI to auto-populate your proposal:
                </p>

                <div className="space-y-2">
                  {[
                    { id: "web_app", label: "Full-Stack Web Application", desc: "Core architecture, UI components, API, QA & deployment" },
                    { id: "brand_design", label: "Brand Identity & UI/UX Design System", desc: "Logo identity, Figma design tokens & user prototypes" },
                    { id: "mobile_app", label: "Cross-Platform Mobile App MVP", desc: "React Native iOS/Android app, cloud backend & App Store publishing" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAiPreset(t.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs ${
                        aiPreset === t.id
                          ? "border-[#00AAF7] bg-[#00AAF7]/10 font-semibold"
                          : "border-border/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-semibold text-foreground">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => handleAiSmartDraft(aiPreset)}
                  className="w-full bg-gradient-to-r from-[#00AAF7] to-[#0284C7] text-white py-5 rounded-xl font-semibold text-xs shadow-lg shadow-[#00AAF7]/20"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  <span>Generate Proposal SOW</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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
