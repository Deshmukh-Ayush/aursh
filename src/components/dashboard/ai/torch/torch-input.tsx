"use client";

import * as React from "react";
import { useTorch } from "./torch-context";
import { LexicalAIInput } from "../lexical-ai-input";

export interface TorchInputProps {
  suggestions?: string[];
}

export function TorchInput() {
  const { sendMessage, loading, projects } = useTorch();

  return (
    <div>
      <LexicalAIInput
        onSend={sendMessage}
        disabled={loading}
        projects={projects}
      />
    </div>
  );
}
