"use client";

import * as React from "react";
import { TorchProvider, WorkspaceSummary } from "./torch-context";
import { LexicalProjectOption } from "../lexical-ai-input";
import { cn } from "@/lib/utils";

export interface TorchRootProps extends React.HTMLAttributes<HTMLDivElement> {
  orgName: string;
  userName?: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
  children: React.ReactNode;
}

export function TorchRoot({
  orgName,
  userName,
  projects,
  workspaceSummary,
  children,
  className,
  ...props
}: TorchRootProps) {
  return (
    <TorchProvider
      orgName={orgName}
      userName={userName}
      projects={projects}
      workspaceSummary={workspaceSummary}
    >
      <div
        className={cn("flex flex-col flex-1 w-full min-h-0", className)}
        {...props}
      >
        {children}
      </div>
    </TorchProvider>
  );
}
