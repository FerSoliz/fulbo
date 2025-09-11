'use server';

/**
 * @fileOverview Prioritizes troubleshooting steps based on relevance and likelihood of resolving the issue.
 *
 * - prioritizeSolutions - A function that prioritizes the suggested troubleshooting steps.
 * - PrioritizeSolutionsInput - The input type for the prioritizeSolutions function.
 * - PrioritizeSolutionsOutput - The return type for the prioritizeSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeSolutionsInputSchema = z.object({
  errorDescription: z.string().describe('The description of the error encountered by the user.'),
  suggestedSolutions: z.array(z.string()).describe('An array of suggested troubleshooting steps.'),
});
export type PrioritizeSolutionsInput = z.infer<typeof PrioritizeSolutionsInputSchema>;

const PrioritizeSolutionsOutputSchema = z.array(
  z.object({
    solution: z.string().describe('A troubleshooting step.'),
    priority: z.number().describe('The priority of the solution (higher is better).'),
    rationale: z.string().describe('The rationale for the assigned priority.'),
  })
);
export type PrioritizeSolutionsOutput = z.infer<typeof PrioritizeSolutionsOutputSchema>;

export async function prioritizeSolutions(input: PrioritizeSolutionsInput): Promise<PrioritizeSolutionsOutput> {
  return prioritizeSolutionsFlow(input);
}

const prioritizeSolutionsPrompt = ai.definePrompt({
  name: 'prioritizeSolutionsPrompt',
  input: {schema: PrioritizeSolutionsInputSchema},
  output: {schema: PrioritizeSolutionsOutputSchema},
  prompt: `You are an expert in troubleshooting access issues. Given an error description and a list of suggested solutions, prioritize the solutions based on their relevance and likelihood of resolving the issue. Provide a rationale for each solution's priority.

Error Description: {{{errorDescription}}}

Suggested Solutions:
{{#each suggestedSolutions}}
- {{{this}}}
{{/each}}

Output the solutions with a priority (higher is better) and a rationale for each.  Ensure the output is a JSON array.
`,
});

const prioritizeSolutionsFlow = ai.defineFlow(
  {
    name: 'prioritizeSolutionsFlow',
    inputSchema: PrioritizeSolutionsInputSchema,
    outputSchema: PrioritizeSolutionsOutputSchema,
  },
  async input => {
    const {output} = await prioritizeSolutionsPrompt(input);
    return output!;
  }
);
