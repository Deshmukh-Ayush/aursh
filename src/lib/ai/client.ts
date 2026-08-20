import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";

/**
 * AI Model Provider Configuration for Scrunity & Torch Co-pilot.
 *
 * Primary Model: openai/gpt-oss-120b (Groq high-capacity reasoning model)
 * Fallback Model: openai/gpt-oss-20b (Groq ultra-fast fallback model)
 * Classifier Model: openai/gpt-oss-20b (Lightweight instant classifier)
 */

export const primaryModel = groq("openai/gpt-oss-120b");
export const fallbackModel = groq("openai/gpt-oss-20b");
export const scopeModel = primaryModel;
export const classifierModel = fallbackModel;

/**
 * Executes a structured text generation call using the primary model (openai/gpt-oss-120b).
 * If the primary model encounters a rate limit, error, or fails to generate an output,
 * it automatically falls back to the secondary model (openai/gpt-oss-20b).
 */
export async function generateStructuredWithFallback<T>({
  schema,
  system,
  prompt,
}: {
  schema: z.ZodType<T>;
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
      "[AI Model Fallback] Primary model (openai/gpt-oss-120b) error. Retrying with fallback model (openai/gpt-oss-20b)...",
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
  }

  // Fallback Model Execution (openai/gpt-oss-20b)
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
    throw new Error(
      "Both primary (openai/gpt-oss-120b) and fallback (openai/gpt-oss-20b) AI models failed to produce output.",
    );
  }

  return output as T;
}
