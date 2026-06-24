"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestSignaturesAction, signContractAction, deleteContractAction } from "@/app/actions/contract";
import { Trash2 } from "lucide-react";

export function ContractActionButtons({ 
  contractId, 
  status, 
  role, 
  hasSigned 
}: { 
  contractId: string;
  status: string;
  role: string;
  hasSigned: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestSignatures = async () => {
    setIsLoading(true);
    await requestSignaturesAction(contractId);
    setIsLoading(false);
  };

  const handleSign = async () => {
    setIsLoading(true);
    await signContractAction(contractId);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract? You can upload a new one afterwards.")) return;
    setIsLoading(true);
    await deleteContractAction(contractId);
    setIsLoading(false);
  };

  if (status === 'draft' && role === 'owner') {
    return (
      <div className="flex gap-2 w-full">
        <Button onClick={handleRequestSignatures} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Request Signatures"}
        </Button>
        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isLoading} title="Delete Contract">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (status === 'pending_signature') {
    return (
      <div className="flex gap-2 w-full">
        {!hasSigned && (
          <Button onClick={handleSign} disabled={isLoading} className="flex-1 bg-primary">
            {isLoading ? "Signing..." : "Sign Contract"}
          </Button>
        )}
        {role === 'owner' && (
          <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isLoading} title="Delete Contract" className={hasSigned ? "w-full" : ""}>
            {hasSigned ? "Delete Contract" : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
