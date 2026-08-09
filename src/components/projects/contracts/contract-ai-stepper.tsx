"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2Icon, AlertCircleIcon, ShieldCheckIcon } from "lucide-react";

interface ContractAIStepperProps {
  isExtracting: boolean;
  extractedCount: number | null;
  error?: string | null;
  onRetry?: () => void;
}

export function ContractAIStepper({
  isExtracting,
  extractedCount,
  error,
  onRetry,
}: ContractAIStepperProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs dark:bg-rose-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium">AI Extraction Failed: {error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 dark:text-rose-300"
            >
              Retry
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-border/40 bg-white/60 p-4 backdrop-blur-md dark:bg-neutral-900/60"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: AI Status info */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00AAF7]/10 p-1.5 dark:bg-[#00AAF7]/20 border border-[#00AAF7]/20">
            <Image
              src="/logo/scrunity_logo_svg.svg"
              alt="Scrunity AI Logo"
              width={24}
              height={24}
              className={`h-5 w-5 object-contain dark:invert ${isExtracting ? "animate-pulse" : ""}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-foreground">
                Scrunity AI Engine
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Groq GPT-OSS-120B
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isExtracting
                ? "Extracting SOW scope items, exclusions & revision limits..."
                : extractedCount !== null
                  ? `Scope Guard active — ${extractedCount} contract clause${extractedCount === 1 ? "" : "s"} indexed.`
                  : "Upload a contract to parse scope terms automatically."}
            </p>
          </div>
        </div>

        {/* Right: Stepper Pills */}
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-foreground">
            <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
            <span>PDF Uploaded</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              isExtracting
                ? "bg-[#00AAF7]/10 text-[#00AAF7] animate-pulse"
                : extractedCount !== null
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <Image
              src="/logo/scrunity_logo_svg.svg"
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5 object-contain dark:invert"
            />
            <span>{isExtracting ? "Parsing Scope..." : "AI Parsed"}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              extractedCount !== null
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            <span>Scope Guard</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
