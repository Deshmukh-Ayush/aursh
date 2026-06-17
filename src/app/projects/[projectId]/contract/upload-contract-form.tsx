"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadContractAction } from "@/app/actions/contract";

export function UploadContractForm({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(formData: FormData) {
    setIsUploading(true);
    const result = await uploadContractAction(projectId, formData);
    setIsUploading(false);
    if (result.error) {
      alert(result.error);
    }
  }

  return (
    <form action={handleUpload} className="space-y-4 max-w-sm">
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
