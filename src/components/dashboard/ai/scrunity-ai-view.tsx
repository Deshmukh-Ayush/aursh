import * as React from "react";
import { LexicalProjectOption } from "./lexical-ai-input";
import { Torch, WorkspaceSummary } from "./torch";

export type { WorkspaceSummary };

interface ScrunityAIViewProps {
  orgName: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
}

export function ScrunityAIView({
  orgName,
  projects,
  workspaceSummary,
}: ScrunityAIViewProps) {
  return (
    <Torch.Root
      orgName={orgName}
      projects={projects}
      workspaceSummary={workspaceSummary}
    >
      <Torch.Messages />
      <Torch.Input />
    </Torch.Root>
  );
}