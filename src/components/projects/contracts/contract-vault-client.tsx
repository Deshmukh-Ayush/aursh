"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  FileSignature, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  X,
  FileCheck,
  Shield,
  FileCode,
  FileSpreadsheet,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { SignatureModal } from "./signature-modal";

export type ContractWithSignatures = {
  contract: {
    id: string;
    projectId: string;
    fileName: string;
    fileUrl: string;
    documentType: "sow" | "nda" | "noc" | "msa" | "addendum" | "other";
    uploadedByRole: "agency" | "client";
    status: "draft" | "pending_signature" | "signed";
    signedDocumentUrl: string | null;
    documentHash: string | null;
    createdAt: Date;
  };
  uploaderName: string;
  signatures: Array<{
    sigId: string;
    userId: string | null;
    userName: string;
    userEmail: string;
    userImage: string | null;
    signedAt: Date | null;
  }>;
};

type ContractVaultClientProps = {
  projectId: string;
  contracts: ContractWithSignatures[];
  currentUserId: string;
  userRole: "owner" | "agency" | "client";
  orgPlan: string;
};

const DOC_TYPE_MAP: Record<string, { label: string; tag: string }> = {
  sow: { label: "Statement of Work", tag: "SOW" },
  nda: { label: "Non-Disclosure Agreement", tag: "NDA" },
  noc: { label: "NOC / IP Transfer", tag: "NOC" },
  msa: { label: "Master Services Agreement", tag: "MSA" },
  addendum: { label: "Addendum / Change Order", tag: "ADD" },
  other: { label: "General Agreement", tag: "DOC" },
};

const TABS = [
  { id: "all", label: "All Agreements" },
  { id: "sow", label: "SOW & MSA" },
  { id: "nda", label: "NDAs & Compliance" },
  { id: "addendum", label: "Addendums" },
];

export function ContractVaultClient({
  projectId,
  contracts,
  currentUserId,
  userRole,
  orgPlan,
}: ContractVaultClientProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("sow");
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewContract, setActivePreviewContract] = useState<ContractWithSignatures | null>(null);
  
  // Signature Modal State
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const router = useRouter();

  const filteredContracts = contracts.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "sow") return c.contract.documentType === "sow" || c.contract.documentType === "msa";
    if (activeTab === "nda") return c.contract.documentType === "nda" || c.contract.documentType === "noc";
    if (activeTab === "addendum") return c.contract.documentType === "addendum" || c.contract.documentType === "other";
    return true;
  });

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("projectId", projectId);
    formData.append("documentType", selectedDocType);

    try {
      const res = await axios.post("/api/contracts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Document uploaded");
        setIsUploadOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestSignatures = async (contractId: string) => {
    try {
      const res = await axios.patch("/api/contracts", {
        contractId,
        action: "request_signatures",
      });
      if (res.data.success) {
        toast.success("Signatures requested");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to request signatures");
    }
  };

  const handleSignConfirm = async (signatureData?: string, signatureMethod?: string) => {
    if (!signingContractId) return;
    setIsSignatureModalOpen(false);

    try {
      const res = await axios.patch("/api/contracts", {
        contractId: signingContractId,
        action: "sign",
        signatureData,
        signatureMethod,
        orgPlan,
      });
      if (res.data.success) {
        toast.success("Document signed");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to sign document");
    } finally {
      setSigningContractId(null);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Delete this agreement?")) return;
    try {
      const res = await axios.delete(`/api/contracts?contractId=${contractId}`);
      if (res.data.success) {
        toast.success("Agreement deleted");
        if (activePreviewContract?.contract.id === contractId) {
          setActivePreviewContract(null);
        }
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete agreement");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
            Contracts & Agreements
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Review, sign, and manage legal agreements from Agency & Client.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          className="active:scale-[0.96] transition-transform duration-150 h-9 px-4 rounded-full bg-foreground text-background font-medium text-[13px] shadow-sm hover:opacity-90 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          Upload Agreement
        </Button>
      </div>

      {/* Morphing Mini Navbar (Segmented Filter Bar) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav className="relative p-1 rounded-full bg-muted/60 dark:bg-neutral-900/80 border border-border/40 inline-flex gap-1 shadow-xs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = contracts.filter((c) => {
              if (tab.id === "all") return true;
              if (tab.id === "sow") return c.contract.documentType === "sow" || c.contract.documentType === "msa";
              if (tab.id === "nda") return c.contract.documentType === "nda" || c.contract.documentType === "noc";
              if (tab.id === "addendum") return c.contract.documentType === "addendum" || c.contract.documentType === "other";
              return true;
            }).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 flex items-center gap-2 z-10 select-none ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className="absolute inset-0 rounded-full bg-background shadow-xs ring-1 ring-black/5 dark:ring-white/10 z-[-1]"
                    transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                  />
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${isActive ? "bg-muted text-foreground" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inline Document List */}
      {filteredContracts.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-border/60 p-16 flex flex-col items-center justify-center text-center bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
            <FileText className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">No documents in this view</h3>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Upload Statements of Work, NDAs, or NOCs to begin collecting signatures.
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="outline"
            className="active:scale-[0.96] transition-transform duration-150 mt-5 rounded-full text-[13px] font-medium"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="rounded-[20px] border border-border/40 bg-card overflow-hidden divide-y divide-border/30 shadow-xs">
          {filteredContracts.map(({ contract: doc, uploaderName, signatures }, i) => {
            const docInfo = DOC_TYPE_MAP[doc.documentType] || DOC_TYPE_MAP.other;
            const mySignature = signatures.find((s) => s.userId === currentUserId);
            const hasSigned = !!mySignature?.signedAt;
            const signedCount = signatures.filter((s) => s.signedAt).length;

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors duration-150 group"
              >
                {/* Left: Document Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/70 dark:bg-neutral-800 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-foreground/80 stroke-[1.5]" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold tracking-tight text-foreground truncate max-w-[280px] sm:max-w-md">
                        {doc.fileName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono tracking-wider bg-muted/50 border-border/60 text-foreground/80 rounded-md px-1.5 py-0">
                        {docInfo.tag}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
                      <span>Uploaded by {doc.uploadedByRole === "agency" ? "Agency" : "Client"} ({uploaderName})</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Signatures, Status & Actions */}
                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
                  {/* Signers Avatar Stack */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {signatures.map((sig) => (
                        <Avatar key={sig.sigId} className="inline-block w-6 h-6 ring-2 ring-background">
                          <AvatarImage src={sig.userImage || ""} />
                          <AvatarFallback className="text-[9px] font-semibold bg-muted text-foreground">
                            {sig.userName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {signedCount}/{signatures.length}
                    </span>
                  </div>

                  {/* Minimal Status Badge */}
                  <div>
                    {doc.status === "signed" ? (
                      <Badge className="bg-foreground text-background font-semibold text-[11px] rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                        Signed
                      </Badge>
                    ) : doc.status === "pending_signature" ? (
                      <Badge variant="secondary" className="bg-muted text-foreground border border-border/60 font-medium text-[11px] rounded-full px-2.5 py-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground rounded-full px-2.5 py-0.5 border-dashed">
                        Draft
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => setActivePreviewContract({ contract: doc, uploaderName, signatures })}
                      variant="ghost"
                      size="sm"
                      className="active:scale-[0.96] transition-transform duration-150 h-8 px-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Preview
                    </Button>

                    <a
                      href={doc.signedDocumentUrl || doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="active:scale-[0.96] transition-transform duration-150 inline-flex items-center justify-center h-8 px-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {doc.status === "draft" && (userRole === "owner" || userRole === "agency") && (
                      <Button
                        onClick={() => handleRequestSignatures(doc.id)}
                        size="sm"
                        className="active:scale-[0.96] transition-transform duration-150 h-8 text-[12px] rounded-lg bg-foreground text-background font-medium px-3"
                      >
                        Request
                      </Button>
                    )}

                    {doc.status === "pending_signature" && !hasSigned && (
                      <Button
                        onClick={() => {
                          setSigningContractId(doc.id);
                          if (orgPlan === "free") {
                            handleSignConfirm();
                          } else {
                            setIsSignatureModalOpen(true);
                          }
                        }}
                        size="sm"
                        className="active:scale-[0.96] transition-transform duration-150 h-8 text-[12px] rounded-lg bg-foreground text-background font-medium px-3 shadow-xs"
                      >
                        <FileSignature className="w-3.5 h-3.5 mr-1" />
                        Sign
                      </Button>
                    )}

                    {(userRole === "owner" || userRole === "agency") && (
                      <Button
                        onClick={() => handleDeleteContract(doc.id)}
                        variant="ghost"
                        size="sm"
                        className="active:scale-[0.96] transition-transform duration-150 h-8 w-8 p-0 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                        title="Delete Agreement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Contract Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0 }}
              className="bg-card rounded-[20px] max-w-md w-full p-6 shadow-xl border border-border/50 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div>
                  <h2 className="text-[17px] font-semibold text-foreground tracking-tight">Upload Agreement</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Upload an SOW, NDA, or NOC for signatures.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-foreground">Agreement Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "sow", label: "Statement of Work (SOW)" },
                      { id: "nda", label: "Non-Disclosure (NDA)" },
                      { id: "noc", label: "NOC / IP Transfer" },
                      { id: "msa", label: "Master Services (MSA)" },
                      { id: "addendum", label: "Addendum / Change" },
                      { id: "other", label: "General Agreement" },
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setSelectedDocType(type.id)}
                        className={`p-2.5 rounded-xl border text-left text-[12px] font-medium transition-all ${
                          selectedDocType === type.id
                            ? "border-foreground bg-muted font-semibold text-foreground"
                            : "border-border/50 bg-background hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-foreground">PDF File</label>
                  <input
                    name="file"
                    type="file"
                    accept="application/pdf"
                    required
                    disabled={isUploading}
                    className="w-full px-3 py-2 text-[13px] rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">PDF format only (Max 10MB)</p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    variant="outline"
                    className="active:scale-[0.96] transition-transform duration-150 rounded-full text-[13px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="active:scale-[0.96] transition-transform duration-150 rounded-full bg-foreground text-background text-[13px] font-medium px-5"
                  >
                    {isUploading ? "Uploading..." : "Upload Agreement"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {activePreviewContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0 }}
              className="bg-card rounded-[20px] max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-border/50"
            >
              <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-foreground/80" />
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground line-clamp-1">
                      {activePreviewContract.contract.fileName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Uploaded by {activePreviewContract.uploaderName} · Status: {activePreviewContract.contract.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activePreviewContract.contract.signedDocumentUrl || activePreviewContract.contract.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="active:scale-[0.96] transition-transform duration-150 inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-medium bg-background border border-border/60 hover:bg-muted text-foreground"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </a>
                  <button
                    onClick={() => setActivePreviewContract(null)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <iframe
                src={activePreviewContract.contract.signedDocumentUrl || activePreviewContract.contract.fileUrl}
                className="w-full flex-1 border-0 bg-background"
                title="Contract Preview"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Signature Canvas Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setSigningContractId(null);
        }}
        onConfirm={(data, method) => handleSignConfirm(data, method)}
      />
    </div>
  );
}
