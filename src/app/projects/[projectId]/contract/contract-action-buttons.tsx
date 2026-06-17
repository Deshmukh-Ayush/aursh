"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestSignaturesAction, signContractAction } from "@/app/actions/contract";

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

  if (status === 'draft' && role === 'owner') {
    return (
      <Button onClick={handleRequestSignatures} disabled={isLoading}>
        {isLoading ? "Processing..." : "Request Signatures"}
      </Button>
    );
  }

  if (status === 'pending_signature' && !hasSigned) {
    return (
      <Button onClick={handleSign} disabled={isLoading} className="bg-primary">
        {isLoading ? "Signing..." : "Sign Contract"}
      </Button>
    );
  }

  return null;
}
