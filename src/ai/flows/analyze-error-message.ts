'use server';

/**
 * @fileOverview An error message analysis AI agent.
 *
 * - analyzeErrorMessage - A function that analyzes an error message and provides a simplified explanation.
 * - AnalyzeErrorMessageInput - The input type for the analyzeErrorMessage function.
 * - AnalyzeErrorMessageOutput - The return type for the analyzeErrorMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeErrorMessageInputSchema = z.object({
  errorMessage: z
    .string()
    .describe('The error message to be analyzed.'),
});
export type AnalyzeErrorMessageInput = z.infer<typeof AnalyzeErrorMessageInputSchema>;

const AnalyzeErrorMessageOutputSchema = z.object({
  simplifiedExplanation: z.string().describe('A simplified explanation of the error message.'),
});
export type AnalyzeErrorMessageOutput = z.infer<typeof AnalyzeErrorMessageOutputSchema>;

export async function analyzeErrorMessage(input: AnalyzeErrorMessageInput): Promise<AnalyzeErrorMessageOutput> {
  return analyzeErrorMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeErrorMessagePrompt',
  input: {schema: AnalyzeErrorMessageInputSchema},
  output: {schema: AnalyzeErrorMessageOutputSchema},
  prompt: `You are an expert software troubleshooter.  A user has provided you with the following error message.  Explain the error message in simple terms that a non-expert can understand.\n\nError Message: {{{errorMessage}}}`,
});

const analyzeErrorMessageFlow = ai.defineFlow(
  {
    name: 'analyzeErrorMessageFlow',
    inputSchema: AnalyzeErrorMessageInputSchema,
    outputSchema: AnalyzeErrorMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
