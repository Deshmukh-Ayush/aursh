"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function UploadContractForm({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("projectId", projectId);

    try {
      const res = await axios.post('/api/contracts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Contract uploaded successfully");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload contract");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4 max-w-sm">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="contract-file">Contract Document (PDF)</Label>
        <Input 
          id="contract-file" 
          name="file" 
          type="file" 
          accept="application/pdf" 
          required 
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
      </div>
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload Contract"}
      </Button>
    </form>
  );
}
