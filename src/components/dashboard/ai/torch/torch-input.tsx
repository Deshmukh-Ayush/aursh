"use client";

import * as React from "react";
import { useTorch } from "./torch-context";
import { LexicalAIInput } from "../lexical-ai-input";
import { Suggestion } from "@/components/ai-elements/suggestion";

export interface TorchInputProps {
  suggestions?: string[];
}

export function TorchInput() {
  const { sendMessage, loading, projects } = useTorch();

  return (
    <div className="space-y-2 pt-1">
      

      <LexicalAIInput
        onSend={sendMessage}
        disabled={loading}
        projects={projects}
      />
    </div>
  );
}
