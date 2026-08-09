import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";

/**
 * AI Model Provider Configuration for Scrunity.
 *
 * Primary Model: openai/gpt-oss-120b (Groq free tier high-capacity model)
 * Fallback Model: llama-3.3-70b-versatile (Groq fast versatile model)
 * Classifier Model: llama-3.1-8b-instant (Lightweight instant classifier)
 */

export const primaryModel = groq("openai/gpt-oss-120b");
export const fallbackModel = groq("llama-3.3-70b-versatile");
export const scopeModel = primaryModel;
export const classifierModel = groq("llama-3.1-8b-instant");

/**
 * Executes a structured text generation call using the primary model (openai/gpt-oss-120b).
 * If the primary model encounters a rate limit, error, or fails to generate an output,
 * it automatically falls back to the secondary model (llama-3.3-70b-versatile).
 */
export async function generateStructuredWithFallback<T>({
  schema,
  system,
  prompt,
}: {
  schema: any;
  system: string;
  prompt: string;
}): Promise<T> {
  // Attempt Primary Model (openai/gpt-oss-120b)
  try {
    const { output } = await generateText({
      model: primaryModel,
      providerOptions: {
        groq: {
          structuredOutputs: false,
        },
      },
      output: Output.object({ schema }),
      system,
      prompt,
    });

    if (output) return output as T;
  } catch (primaryError) {
    console.warn(
      "[AI Model Fallback] Primary model (openai/gpt-oss-120b) error. Retrying with fallback model (llama-3.3-70b-versatile)...",
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
  }

  // Fallback Model Execution (llama-3.3-70b-versatile)
  const { output } = await generateText({
    model: fallbackModel,
    providerOptions: {
      groq: {
        structuredOutputs: false,
      },
    },
    output: Output.object({ schema }),
    system,
    prompt,
  });

  if (!output) {
    throw new Error("Both primary (openai/gpt-oss-120b) and fallback (llama-3.3-70b-versatile) AI models failed to produce output.");
  }

  return output as T;
}
