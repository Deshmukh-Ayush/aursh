"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateOrgBrandingAction, toggleOrgPlanAction } from "@/app/actions/organization";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Org = {
  id: string;
  brandColor?: string | null;
  plan: string;
  logoUrl?: string | null;
};

export function OrgSettingsForm({ org }: { org: Org }) {
  const [isSaving, setIsSaving] = useState(false);
  const [brandColor, setBrandColor] = useState(org.brandColor || "#000000");

  const isFree = org.plan === "free";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFree) return; // Prevent submission if free (though UI should block it anyway)

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateOrgBrandingAction(org.id, formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Branding updated successfully!");
    }
    
    setIsSaving(false);
  };

  const handleTogglePlan = async () => {
    setIsSaving(true);
    const newPlan = isFree ? "paid" : "free";
    const result = await toggleOrgPlanAction(org.id, newPlan);
    if (result.error) toast.error(result.error);
    else toast.success(`Plan updated to ${newPlan}!`);
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>White-Label Branding</CardTitle>
            <CardDescription>Customize the workspace experience for your clients.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" onClick={handleTogglePlan} disabled={isSaving}>
              Test Switch to {isFree ? "Paid" : "Free"}
            </Button>
            <Badge variant={isFree ? "secondary" : "default"} className="capitalize">
              {org.plan} Plan
            </Badge>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {isFree && (
            <div className="bg-primary/5 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>These features are available on the Paid plan.</span>
              <Button size="sm" variant="outline" type="button" disabled>Upgrade</Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="logo">Agency Logo</Label>
            <Input 
              id="logo" 
              name="logo" 
              type="file" 
              accept="image/*" 
              disabled={isFree}
            />
            {org.logoUrl && !isFree && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Current Logo:</span>
                <img src={org.logoUrl} alt="Logo" className="h-6 object-contain" />
              </p>
            )}
            <p className="text-xs text-muted-foreground">Upload a PNG, JPG, or SVG (max 2MB).</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand Accent Color</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="brandColor" 
                name="brandColor" 
                type="color" 
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={isFree}
                className="w-16 h-10 p-1"
              />
              <Input 
                type="text" 
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={isFree}
                className="flex-1 max-w-[200px]"
                pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
              />
            </div>
            <p className="text-xs text-muted-foreground">This color will be used for buttons, links, and highlights.</p>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6 bg-muted/20">
          <Button type="submit" disabled={isFree || isSaving}>
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
