"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Org = {
  id: string;
  plan: string;
  logoUrl?: string | null;
};

export function OrgSettingsForm({ org }: { org: Org }) {
  const [isSaving, setIsSaving] = useState(false);

  const canWhitelabel = org.plan === "agency";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canWhitelabel) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append("orgId", org.id);

    try {
      const res = await axios.patch('/api/organizations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Branding updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>White-Label Branding</CardTitle>
            <CardDescription>Upload your custom logo for client portals and emails. Available on Agency plan.</CardDescription>
          </div>
          <Badge variant={canWhitelabel ? "default" : "secondary"} className="capitalize">
            {org.plan} Plan
          </Badge>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {!canWhitelabel && (
            <div className="bg-primary/5 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>These features are exclusively available on the Agency plan.</span>
              <Button size="sm" variant="outline" type="button" disabled>Upgrade to Agency</Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="logo">Agency Logo</Label>
            <Input 
              id="logo" 
              name="logo" 
              type="file" 
              accept="image/*" 
              disabled={!canWhitelabel}
            />
            {org.logoUrl && canWhitelabel && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Current Logo:</span>
                <img src={org.logoUrl} alt="Logo" className="h-6 object-contain" />
              </p>
            )}
            <p className="text-xs text-muted-foreground">Upload a PNG, JPG, or SVG (max 2MB).</p>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6 bg-muted/20">
          <Button type="submit" disabled={!canWhitelabel || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
