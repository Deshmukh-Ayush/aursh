"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  UploadCloud, 
  Clock, 
  FileSignature, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  X,
  Shield,
  ArrowRight
} from "lucide-react";
import { SealCheckIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { SignatureModal } from "./signature-modal";
import { ContractStatusChart } from "./contract-status-chart";

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

export function ContractVaultClient({
  projectId,
  contracts,
  currentUserId,
  userRole,
}: ContractVaultClientProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("sow");
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewContract, setActivePreviewContract] = useState<ContractWithSignatures | null>(null);
  
  // Signature Modal State
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const router = useRouter();

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
        toast.success("Document uploaded to vault");
        setIsUploadOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to delete this agreement?")) return;
    try {
      const res = await axios.delete(`/api/contracts?contractId=${contractId}`);
      if (res.data.success) {
        toast.success("Agreement deleted");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete agreement");
    }
  };

  const handleOpenSignatureModal = (contractId: string) => {
    setSigningContractId(contractId);
    setIsSignatureModalOpen(true);
  };

  const handleConfirmSignature = async (signatureData: string, method: string) => {
    if (!signingContractId) return;
    try {
      const res = await axios.post("/api/contracts/sign", {
        contractId: signingContractId,
        signatureData,
        signatureMethod: method,
      });
      if (res.data.success) {
        toast.success("Document signed & cryptographic seal generated!");
        setIsSignatureModalOpen(false);
        setSigningContractId(null);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to sign document");
    }
  };

  const isAgency = userRole === "owner" || userRole === "agency";

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "signed":
        return {
          label: "Signed",
          Icon: SealCheckIcon,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      case "pending_signature":
        return {
          label: "Pending Signature",
          Icon: PaperPlaneTiltIcon,
          color: "text-sky-500",
          bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        };
      default:
        return {
          label: "Draft",
          Icon: Clock,
          color: "text-purple-500",
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        };
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
            Contracts & Agreements
          </h1>
        </div>

        {isAgency && (
          <button
            onClick={() => setIsUploadOpen(true)}
            aria-label="Upload legal agreement"
            className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5 stroke-3" />
            <span>Upload Agreement</span>
          </button>
        )}
      </div>

      {/* EvilCharts Contract Legal Vault Radial Chart */}
      <ContractStatusChart contracts={contracts} />

      {/* Contract Agreements List Section */}
      <section aria-label="Project Agreements Vault" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground text-balance">
            All Vaulted Agreements (<span className="tabular-nums">{contracts.length}</span>)
          </h2>
        </div>

        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight text-balance">No Agreements Vaulted</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed text-pretty">
              Upload SOWs, NDAs, or Master Services Agreements to collect verified cryptographic e-signatures.
            </p>
            {isAgency && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-5 active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Upload First Agreement
              </button>
            )}
          </div>
        ) : (
          <div>
            {contracts.map((item, index) => {
              const statusConfig = getStatusConfig(item.contract.status);
              const StatusIcon = statusConfig.Icon;
              const docType = DOC_TYPE_MAP[item.contract.documentType] || DOC_TYPE_MAP.other;
              const isSigned = item.contract.status === "signed";
              
              const userSig = item.signatures.find((s) => s.userId === currentUserId);
              const hasCurrentUserSigned = !!userSig?.signedAt;
              const signedCount = item.signatures.filter((s) => s.signedAt).length;

              return (
                <motion.div
                  key={item.contract.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors rounded-md"
                >
                  {/* Left: Icon, Title & Badge */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusIcon className={`w-4 h-4 shrink-0 ${statusConfig.color}`} />

                    <span className="text-sm font-medium tracking-tight text-foreground truncate max-w-50 sm:max-w-xs text-balance">
                      {item.contract.fileName}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-muted/60 text-muted-foreground border border-border/30 shrink-0">
                      {docType.tag}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${statusConfig.bg} shrink-0`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Right: Signers, Date & Actions */}
                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 ml-7 sm:ml-0">
                    {/* Signatures Status */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex -space-x-1.5">
                        {item.signatures.map((sig) => (
                          <Avatar key={sig.sigId} className="w-5 h-5 border border-background">
                            <AvatarImage src={sig.userImage || undefined} />
                            <AvatarFallback className="text-[9px] bg-muted">{sig.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="tabular-nums font-medium">
                        {signedCount}/{item.signatures.length || 1} Signed
                      </span>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {format(new Date(item.contract.createdAt), "dd MMM")}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 min-w-22.5 justify-end">
                      {!hasCurrentUserSigned && !isSigned && (
                        <button
                          onClick={() => handleOpenSignatureModal(item.contract.id)}
                          aria-label={`Sign agreement ${item.contract.fileName}`}
                          className="flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium rounded-full bg-[#00AAF7] text-white hover:bg-[#0088c4] transition-colors active:scale-[0.96]"
                        >
                          Sign <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setActivePreviewContract(item)}
                        aria-label={`Preview agreement ${item.contract.fileName}`}
                        className="flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium rounded-full border border-border/60 bg-background text-foreground hover:bg-muted/60 transition-colors active:scale-[0.96]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>

                      <a
                        href={item.contract.signedDocumentUrl || item.contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                        title="Download Document"
                        aria-label={`Download agreement ${item.contract.fileName}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {isAgency && !isSigned && (
                        <button
                          onClick={() => handleDeleteContract(item.contract.id)}
                          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-[0.96]"
                          aria-label={`Delete agreement ${item.contract.fileName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Upload Agreement Form */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold tracking-tight text-foreground text-balance">Upload Agreement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Document Type</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-medium"
                  >
                    <option value="sow">Statement of Work (SOW)</option>
                    <option value="nda">Non-Disclosure Agreement (NDA)</option>
                    <option value="noc">NOC / IP Transfer</option>
                    <option value="msa">Master Services Agreement (MSA)</option>
                    <option value="addendum">Addendum / Change Order</option>
                    <option value="other">General Agreement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">PDF Document File</label>
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="h-9 px-4 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted active:scale-[0.96]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="active:scale-[0.96] transition-transform h-9 px-5 rounded-full bg-[#00AAF7] text-white font-semibold text-xs shadow-md hover:bg-[#0088c4] flex items-center gap-1.5"
                  >
                    {isUploading ? "Uploading..." : "Upload Agreement"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Document PDF Preview */}
      <AnimatePresence>
        {activePreviewContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/60 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground text-balance">
                      {activePreviewContract.contract.fileName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Uploaded by {activePreviewContract.uploaderName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={activePreviewContract.contract.signedDocumentUrl || activePreviewContract.contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="h-8 px-3 text-xs rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => setActivePreviewContract(null)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-neutral-900 overflow-hidden">
                <iframe
                  src={activePreviewContract.contract.signedDocumentUrl || activePreviewContract.contract.fileUrl}
                  className="w-full h-full border-none"
                  title="PDF Document Preview"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Signature Modal Component */}
      {signingContractId && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSigningContractId(null);
          }}
          onConfirm={handleConfirmSignature}
        />
      )}
    </div>
  );
}
