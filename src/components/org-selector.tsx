"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function OrgSelector() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient.organization.list()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setOrganizations(res.data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load organizations", err);
        setIsLoading(false);
      });
  }, []);

  const handleSelect = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    router.push("/dashboard");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-medium">Loading your organization...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto text-left">
        <Card className="border-primary/20 shadow-lg bg-card">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Scrunity</CardTitle>
            <CardDescription className="text-base mt-2">
              To get started, set up your organization or agency name.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8 pt-4">
            <Button size="lg" onClick={() => router.push("/onboarding")} className="h-12 px-8 text-base shadow-md group">
              Set Up Organization
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-2">
      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Card 
            key={org.id} 
            className="group cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
            onClick={() => handleSelect(org.id)}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <span className="text-lg font-bold uppercase">{org.name.charAt(0)}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-lg">{org.name}</span>
                  <span className="text-sm text-muted-foreground">Organization</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
