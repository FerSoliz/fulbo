"use server";

import { analyzeErrorMessage } from "@/ai/flows/analyze-error-message";
import { generateTroubleshootingSteps } from "@/ai/flows/generate-troubleshooting-steps";
import { prioritizeSolutions } from "@/ai/flows/prioritize-solutions";
import { searchKnowledgeBase } from "@/ai/flows/search-knowledge-base";
import { AIResults } from "@/lib/types";

export async function getTroubleshootingInfo(
  errorMessage: string
): Promise<AIResults> {
  try {
    const analysis = await analyzeErrorMessage({ errorMessage });

    const [stepsResult, kbResult] = await Promise.all([
      generateTroubleshootingSteps({
        errorMessage,
        errorAnalysis: analysis.simplifiedExplanation,
      }),
      searchKnowledgeBase({ errorMessage }),
    ]);

    const prioritizedSolutions = await prioritizeSolutions({
      errorDescription: errorMessage,
      suggestedSolutions: stepsResult.troubleshootingSteps,
    });

    // Sort solutions by priority, descending
    prioritizedSolutions.sort((a, b) => b.priority - a.priority);

    return {
      analysis: analysis.simplifiedExplanation,
      solutions: prioritizedSolutions,
      knowledgeBase: kbResult.searchResults,
    };
  } catch (error) {
    console.error("Error in getTroubleshootingInfo:", error);
    // Re-throw the error to be caught by the client-side caller
    throw new Error("Failed to process troubleshooting information.");
  }
}
