import * as React from "react";
import { LexicalProjectOption } from "./lexical-ai-input";
import { Torch, WorkspaceSummary } from "./torch";

export type { WorkspaceSummary };

interface ScrunityAIViewProps {
  orgName: string;
  userName?: string;
  projects: LexicalProjectOption[];
  workspaceSummary?: WorkspaceSummary;
}

export function ScrunityAIView({
  orgName,
  userName,
  projects,
  workspaceSummary,
}: ScrunityAIViewProps) {
  return (
    <Torch.Root
      orgName={orgName}
      userName={userName}
      projects={projects}
      workspaceSummary={workspaceSummary}
    >
      <Torch.Messages />
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-background/0 pt-4 pb-2">
        <Torch.Input />
      </div>
    </Torch.Root>
  );
}
