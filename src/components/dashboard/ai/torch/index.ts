import { TorchRoot } from "./torch-root";
import { TorchHeader } from "./torch-header";
import { TorchMessages } from "./torch-messages";
import { TorchReasoning } from "./torch-reasoning";
import { TorchArtifact } from "./torch-artifact";
import { TorchInput } from "./torch-input";

export const Torch = {
  Root: TorchRoot,
  Header: TorchHeader,
  Messages: TorchMessages,
  Reasoning: TorchReasoning,
  Artifact: TorchArtifact,
  Input: TorchInput,
};

export { useTorch } from "./torch-context";
export type { TorchMessage, ToolCallStep, WorkspaceSummary } from "./torch-context";
