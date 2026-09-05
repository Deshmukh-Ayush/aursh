"use client";

import * as React from "react";
import { useTorch } from "./torch-context";
import { LexicalAIInput } from "../lexical-ai-input";

export interface TorchInputProps {
  suggestions?: string[];
}

export function TorchInput() {
  const { sendMessage, loading, projects, webSearchEnabled, setWebSearchEnabled } = useTorch();

  return (
    <div className="w-full">
      <LexicalAIInput
        onSend={sendMessage}
        disabled={loading}
        projects={projects}
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={setWebSearchEnabled}
      />
    </div>
  );
}
