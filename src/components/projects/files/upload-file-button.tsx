"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFileAction } from "@/app/actions/file";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

export function UploadFileButton({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const result = await uploadFileAction(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File uploaded successfully");
    }
    
    setIsUploading(false);
    // Reset the input
    e.target.value = "";
  };

  return (
    <div className="relative">
      <Input 
        type="file" 
        onChange={handleFileChange} 
        disabled={isUploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <Button disabled={isUploading} className="flex items-center gap-2">
        <UploadCloud className="w-4 h-4" />
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
