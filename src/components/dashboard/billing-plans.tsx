"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

type PlanType = "free" | "freelancer" | "agency";

export function BillingPlans({ orgId, currentPlan }: { orgId: string, currentPlan: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === currentPlan) return;
    setIsUpdating(true);
    setIsUpdating(true);
    
    try {
      const res = await axios.patch('/api/organizations', { orgId, plan });
      if (res.data.success) {
        toast.success("Successfully switched to " + plan + " plan!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to switch plan");
    } finally {
      setIsUpdating(false);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Perfect for getting started.",
      features: [
        "1 Active Project",
        "No Organization Teammates",
        "Standard Support",
      ],
      disabledFeatures: [
        "White-label branding",
        "Unlimited Projects",
      ]
    },
    {
      id: "freelancer",
      name: "Freelancer",
      price: "$9",
      period: "/mo",
      description: "For solo professionals managing multiple clients.",
      features: [
        "Unlimited Active Projects",
        "No Organization Teammates",
        "Priority Support",
      ],
      disabledFeatures: [
        "White-label branding",
      ]
    },
    {
      id: "agency",
      name: "Agency",
      price: "$19",
      period: "/mo",
      description: "For teams requiring a fully white-labeled experience.",
      features: [
        "Unlimited Active Projects",
        "Up to 5 Organization Teammates",
        "Full White-label Branding",
        "Custom Logo & Brand Colors",
        "24/7 Priority Support",
      ],
      disabledFeatures: []
    }
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Plans & Billing</h2>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your needs. For this MVP, clicking upgrade instantly applies the tier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isActive = currentPlan === plan.id;
          
          return (
            <Card key={plan.id} className={"relative flex flex-col " + (isActive ? 'border-primary shadow-md' : 'border-border/40')}>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-0.5 shadow-sm">
                    Current Plan
                  </Badge>
                </div>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="h-10 mt-2">{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline text-3xl font-bold">
                  {plan.price}
                  {plan.period && <span className="text-sm font-normal text-muted-foreground ml-1">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-3 text-sm">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                  {plan.disabledFeatures.map(f => (
                    <li key={f} className="flex items-center gap-3 opacity-50">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground line-through">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button 
                  className="w-full" 
                  variant={isActive ? "outline" : "default"}
                  disabled={isActive || isUpdating}
                  onClick={() => handleUpgrade(plan.id as PlanType)}
                >
                  {isActive ? "Current Plan" : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
