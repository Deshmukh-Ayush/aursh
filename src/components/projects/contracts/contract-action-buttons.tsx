"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleRequestSignatures = async () => {
    setIsLoading(true);
    try {
      const res = await axios.patch('/api/contracts', { contractId, action: "request_signatures" });
      if (res.data.success) {
        toast.success("Signatures requested successfully");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to request signatures");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    setIsLoading(true);
    try {
      const res = await axios.patch('/api/contracts', { contractId, action: "sign" });
      if (res.data.success) {
        toast.success("Contract signed successfully");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to sign contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract? You can upload a new one afterwards.")) return;
    setIsLoading(true);
    try {
      const res = await axios.delete(`/api/contracts?contractId=${contractId}`);
      if (res.data.success) {
        toast.success("Contract deleted successfully");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete contract");
    } finally {
      setIsLoading(false);
    }
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
