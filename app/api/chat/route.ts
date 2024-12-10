import { generateCourses } from '@/app/prompts/extractCourses';
import { generateSuggestionsText } from '@/app/prompts/generateSuggestions';
import { systemPrompt } from '@/app/prompts/system';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: systemPrompt.generate(),
    tools: {
      getCoursesAndSuggestions: {
        description: 'Extract courses from the context and transform into an object',
        parameters: z.object({ context: z.string() }),
        execute: async ({ context }: { context: string }) => {
          const generatedCourses = await generateCourses(context);
          const generatedSuggestionsText = await generateSuggestionsText(context);
          return { generatedCourses, generatedSuggestionsText };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}