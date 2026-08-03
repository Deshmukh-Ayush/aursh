"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignatureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string, method: string) => void;
};

export function SignatureModal({ isOpen, onClose, onConfirm }: SignatureModalProps) {
  const [method, setMethod] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadData, setUploadData] = useState<string | null>(null);

  // Drawing logic
  useEffect(() => {
    if (method === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, [method, isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.beginPath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Typed name to canvas
  useEffect(() => {
    if (method === "type" && typedCanvasRef.current) {
      const canvas = typedCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (typedName) {
           ctx.font = "48px var(--font-dancing-script)";
           ctx.fillStyle = "#000";
           ctx.textBaseline = "middle";
           ctx.textAlign = "center";
           ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        }
      }
    }
  }, [typedName, method]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    let signatureData = "";

    if (method === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        signatureData = canvas.toDataURL("image/png");
        // Quick check if empty
        const ctx = canvas.getContext("2d");
        const pixelData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
        const hasData = pixelData?.some(p => p !== 0);
        if (!hasData) return;
      }
    } else if (method === "type") {
      if (!typedName.trim()) return;
      const canvas = typedCanvasRef.current;
      if (canvas) signatureData = canvas.toDataURL("image/png");
    } else if (method === "upload") {
      if (!uploadData) return;
      signatureData = uploadData;
    }

    if (signatureData) {
      onConfirm(signatureData, method);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sign Contract</DialogTitle>
          <DialogDescription>
            Choose how you would like to sign this contract.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="draw" onValueChange={(val) => setMethod(val as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border rounded-md bg-white">
              <canvas
                ref={canvasRef}
                width={460}
                height={200}
                className="w-full h-[200px] touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-2">
              <Label>Type your full name</Label>
              <Input 
                value={typedName} 
                onChange={e => setTypedName(e.target.value)} 
                placeholder="John Doe" 
              />
            </div>
            <div className="border rounded-md bg-white flex items-center justify-center h-[200px] overflow-hidden">
              <canvas ref={typedCanvasRef} width={460} height={200} className="w-full h-full" />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
             <div className="space-y-2">
               <Label>Upload Signature Image</Label>
               <Input type="file" accept="image/*" onChange={handleUpload} />
             </div>
             {uploadData && (
                <div className="border rounded-md bg-white flex items-center justify-center h-[200px]">
                   <img src={uploadData} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                </div>
             )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Sign & Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
