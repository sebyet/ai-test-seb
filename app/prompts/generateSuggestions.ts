import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const generateSuggestionsPrompt = {
  content: 'Generate a phrase that tell the users why we are suggesting them these courses: {{context}}',
  generate: (params: { context: string }) => {
    return generateSuggestionsPrompt.content.replace('{{context}}', params.context);
  }
};

export async function generateSuggestionsText(context: string) {
  const result = generateText({
    model: openai('gpt-4o-mini'),
    prompt: generateSuggestionsPrompt.generate({ context }),
  });

  return result;
}