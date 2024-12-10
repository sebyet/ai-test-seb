import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const extractCoursesPrompt = {
  content: 'Extract courses from the context and deliver 3 courses: {{context}}',
  generate: (params: { context: string }) => {
    return extractCoursesPrompt.content.replace('{{context}}', params.context);
  }
};

export async function generateCourses(context: string) {
  const result = generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      courses: z.array(z.object({
        name: z.string(),
        description: z.string(),
        instructor: z.string(),
        level: z.string(),
        courseId: z.string(),
        price: z.number(),
        duration: z.number(),
      })),
    }),
    prompt: extractCoursesPrompt.generate({ context }),
  });

  return result;
}