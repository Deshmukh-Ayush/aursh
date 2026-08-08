"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Shield } from "lucide-react";
import type { ContractWithSignatures } from "./contract-vault-client";

type ContractVaultPreviewModalProps = {
  contract: ContractWithSignatures | null;
  onClose: () => void;
};

export function ContractVaultPreviewModal({ contract, onClose }: ContractVaultPreviewModalProps) {
  return (
    <AnimatePresence>
      {contract && (
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
                    {contract.contract.fileName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Uploaded by {contract.uploaderName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={contract.contract.signedDocumentUrl || contract.contract.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="h-8 px-3 text-xs rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-neutral-900 overflow-hidden">
              <iframe
                src={contract.contract.signedDocumentUrl || contract.contract.fileUrl}
                className="w-full h-full border-none"
                title="PDF Document Preview"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
