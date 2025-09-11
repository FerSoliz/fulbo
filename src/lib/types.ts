import type { PrioritizeSolutionsOutput } from "@/ai/flows/prioritize-solutions";

export type AIResults = {
  analysis: string;
  solutions: PrioritizeSolutionsOutput;
  knowledgeBase: string[];
};
