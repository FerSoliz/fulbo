'use server';

/**
 * @fileOverview Searches a knowledge base for relevant solutions based on an error message.
 *
 * - searchKnowledgeBase - A function that searches the knowledge base.
 * - SearchKnowledgeBaseInput - The input type for the searchKnowledgeBase function.
 * - SearchKnowledgeBaseOutput - The return type for the searchKnowledgeBase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchKnowledgeBaseInputSchema = z.object({
  errorMessage: z.string().describe('The error message to search for solutions.'),
});
export type SearchKnowledgeBaseInput = z.infer<typeof SearchKnowledgeBaseInputSchema>;

const SearchKnowledgeBaseOutputSchema = z.object({
  searchResults: z
    .array(z.string())
    .describe('The search results from the knowledge base.'),
});
export type SearchKnowledgeBaseOutput = z.infer<typeof SearchKnowledgeBaseOutputSchema>;

export async function searchKnowledgeBase(input: SearchKnowledgeBaseInput): Promise<SearchKnowledgeBaseOutput> {
  return searchKnowledgeBaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchKnowledgeBasePrompt',
  input: {schema: SearchKnowledgeBaseInputSchema},
  output: {schema: SearchKnowledgeBaseOutputSchema},
  prompt: `You are an AI assistant that searches a knowledge base for solutions to error messages.

  Given the following error message, search the knowledge base and return a list of relevant solutions.

  Error Message: {{{errorMessage}}}

  Knowledge Base Search Results:`, // Removed the Handlebars expression as it's the expected output
});

const searchKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'searchKnowledgeBaseFlow',
    inputSchema: SearchKnowledgeBaseInputSchema,
    outputSchema: SearchKnowledgeBaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
