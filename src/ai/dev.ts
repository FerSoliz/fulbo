import { config } from 'dotenv';
config();

import '@/ai/flows/generate-troubleshooting-steps.ts';
import '@/ai/flows/prioritize-solutions.ts';
import '@/ai/flows/search-knowledge-base.ts';
import '@/ai/flows/analyze-error-message.ts';