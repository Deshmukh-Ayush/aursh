"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateProjectDialogProps {
  defaultCurrency?: "USD" | "INR";
}

export function CreateProjectDialog({ defaultCurrency = "USD" }: CreateProjectDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "INR">(defaultCurrency);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const res = await axios.post('/api/projects', formData);
      
      if (res.data.success) {
        posthog.capture("project_created");
        setOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-brand text-white font-medium text-sm flex items-center gap-1.5 shadow-xs hover:bg-brand-hover border-none">
          <Plus className="h-4 w-4" />
          <span>Create Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Start a new project and invite your client to collaborate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Project Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Acme Redesign"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientEmail" className="text-right">
                Client Email
              </Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                placeholder="client@example.com"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right text-xs">
                Currency
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <input type="hidden" name="currency" value={currency} />
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={cn(
                    "flex-1 py-1.5 px-3 text-xs font-medium rounded-md border transition-all text-center",
                    currency === "USD"
                      ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"
                  )}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={cn(
                    "flex-1 py-1.5 px-3 text-xs font-medium rounded-md border transition-all text-center",
                    currency === "INR"
                      ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"
                  )}
                >
                  INR (₹)
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground col-span-4 pl-[calc(25%+1rem)] -mt-1">
              All proposals, milestones, and invoices in this project will use this currency.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
