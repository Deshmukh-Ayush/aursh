"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Download, Eye, Trash2, ArrowRight, SparklesIcon } from "lucide-react";
import { SealCheckIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ContractWithSignatures } from "./contract-vault-client";
import { useAIStore } from "@/store/ai-store";

type ContractVaultItemProps = {
  item: ContractWithSignatures;
  currentUserId: string;
  isAgency: boolean;
  docTypeMap: Record<string, { label: string; tag: string }>;
  index: number;
  onOpenSignModal: (id: string) => void;
  onOpenPreview: (item: ContractWithSignatures) => void;
  onDeleteContract: (id: string) => void;
};

export function ContractVaultItem({
  item,
  currentUserId,
  isAgency,
  docTypeMap,
  index,
  onOpenSignModal,
  onOpenPreview,
  onDeleteContract,
}: ContractVaultItemProps) {
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

  const statusConfig = getStatusConfig(item.contract.status);
  const StatusIcon = statusConfig.Icon;
  const docType = docTypeMap[item.contract.documentType] || docTypeMap.other;
  const isSigned = item.contract.status === "signed";
  
  const userSig = item.signatures.find((s) => s.userId === currentUserId);
  const hasCurrentUserSigned = !!userSig?.signedAt;
  const signedCount = item.signatures.filter((s) => s.signedAt).length;

  return (
    <motion.div
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

        {/* AI Clause Inspector Button */}
        <button
          onClick={() => {
            const { openDrawer } = useAIStore.getState();
            openDrawer(item.contract.id, item.contract.fileName);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-[#00AAF7]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00AAF7] hover:bg-[#00AAF7]/20 transition-colors active:scale-[0.96] shrink-0"
        >
          <SparklesIcon className="h-3 w-3" />
          <span>AI Clauses</span>
        </button>
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
              onClick={() => onOpenSignModal(item.contract.id)}
              aria-label={`Sign agreement ${item.contract.fileName}`}
              className="flex items-center gap-1 h-7 px-2.5 text-[12px] font-medium rounded-full bg-[#00AAF7] text-white hover:bg-[#0088c4] transition-colors active:scale-[0.96]"
            >
              Sign <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onOpenPreview(item)}
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
              onClick={() => onDeleteContract(item.contract.id)}
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
}
