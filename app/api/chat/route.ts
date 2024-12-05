import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, streamObject, streamText } from 'ai';
import { object, z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const context = `1. Introduction to Digital Marketing
Description:
A beginner-friendly course covering the essentials of digital marketing, including SEO basics, social media strategy, and content marketing fundamentals.
Instructor: Sarah Johnson
Level: Beginner
Course ID: MKT101
Price: $99
Duration: 6 weeks
2. Python Programming Masterclass
Description:
An advanced course designed for experienced programmers to master async programming, design patterns, and system architecture.
Instructor: Mike Chen
Level: Advanced
Course ID: CS302
Price: $199
Duration: 8 weeks
3. Fundamentals of Graphic Design
Description:
Learn the principles of visual communication and graphic design, focusing on layout, typography, and color theory.
Instructor: Emily Davis
Level: Beginner
Course ID: GD101
Price: $89
Duration: 4 weeks
4. Data Science for Business
Description:
Aimed at professionals, this course introduces data science techniques for solving real-world business problems, with tools like Python and Tableau.
Instructor: Dr. Ravi Patel
Level: Intermediate
Course ID: DS205
Price: $149
Duration: 6 weeks
5. Introduction to Cybersecurity
Description:
Covers the fundamentals of cybersecurity, including threat analysis, cryptography basics, and risk management.
Instructor: Laura Bennett
Level: Beginner
Course ID: CYB100
Price: $120
Duration: 5 weeks
`;

async function generateCourses(context: string) {
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
    prompt: `Extract courses from the context and deliver 3 courses: ${context}`,
  });

  return result;
}

async function generateSuggestionsText(context: string) {
  const result = generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Generate a phrase that tell the users why we are suggesting them these courses: ${context}`,
  });

  return result;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: `You are a helpful assistant. Use the available information and appropriate tools to help users.
    Available Context:
    ${context}
    Instructions:
    - If the user asks for courses, use the courses in the context, and use the getCoursesAndSuggestions tool to generate an object with the courses and a phrase that tell the users why we are suggesting them these courses.
    - If the user asks for anything else, just respond with a friendly message.
    `,
    tools: {
      // server-side tool with execute function:
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