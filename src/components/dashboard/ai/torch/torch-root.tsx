"use client";

import * as React from "react";
import { TorchProvider, WorkspaceSummary } from "./torch-context";
import { LexicalProjectOption } from "../lexical-ai-input";
import { cn } from "@/lib/utils";

export interface TorchRootProps extends React.HTMLAttributes<HTMLDivElement> {
  orgName: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
  children: React.ReactNode;
}

export function TorchRoot({
  orgName,
  projects,
  workspaceSummary,
  children,
  className,
  ...props
}: TorchRootProps) {
  return (
    <TorchProvider
      orgName={orgName}
      projects={projects}
      workspaceSummary={workspaceSummary}
    >
      <div
        className={cn(
          "flex flex-col flex-1 h-full w-full space-y-4 overflow-hidden",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TorchProvider>
  );
}
