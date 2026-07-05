"use client";

import Link from "next/link";
import { AlertCircle, FileSignature } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ContractBanner({ 
  projectId, 
  status, 
  role 
}: { 
  projectId: string; 
  status: "none" | "draft" | "pending_signature" | "signed"; 
  role: "owner" | "client" | "agency"; 
}) {
  if (status === "signed") return null;

  const isOwner = role === "owner";

  return (
    <Alert className="mb-8 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 shadow-sm transition-all hover:shadow-md">
      <AlertCircle className="h-5 w-5 !text-amber-600 dark:!text-amber-500 top-4" />
      <div className="ml-2">
        <AlertTitle className="font-semibold text-base mb-1">
          {status === "none" ? "Contract Missing" : "Contract Pending Signatures"}
        </AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mt-0">
          <span className="opacity-90 leading-relaxed max-w-2xl">
            {status === "none" 
              ? isOwner 
                ? "Please upload a contract for this project to formally begin. While you have full access to the workspace, formalizing the agreement is recommended."
                : "The project owner has not uploaded a contract yet. You can explore the workspace in the meantime."
              : "The contract is pending signatures. Please review and sign the agreement to formally proceed."}
          </span>
          <Button asChild size="sm" variant="outline" className="w-fit shrink-0 bg-background hover:bg-muted text-foreground border-border shadow-sm font-medium">
            <Link href={`/projects/${projectId}/contract`}>
              <FileSignature className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-500" />
              {status === "none" && isOwner ? "Upload Contract" : "View Contract"}
            </Link>
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
}
