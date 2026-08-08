"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X } from "lucide-react";

type ContractVaultUploadModalProps = {
  isOpen: boolean;
  selectedDocType: string;
  isUploading: boolean;
  onClose: () => void;
  onDocTypeChange: (type: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function ContractVaultUploadModal({
  isOpen,
  selectedDocType,
  isUploading,
  onClose,
  onDocTypeChange,
  onSubmit,
}: ContractVaultUploadModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => onDocTypeChange(e.target.value)}
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
                  onClick={onClose}
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
  );
}
