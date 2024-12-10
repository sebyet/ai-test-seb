import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createScorer, evalite } from "evalite";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { cacheModel } from "./cache-model";
import { traceAISDKModel } from "evalite/ai-sdk";
import { reportTrace } from "evalite/traces";

const storage = createStorage({
  driver: (fsDriver as any)({
    base: "./llm-cache.local",
  }),
});

const REQUIRED_PHRASES = [
  "beginner-friendly",
  "advanced",
  "recommended",
  "investment",
  "specific benefit",
  "unique feature",
  "course name",
  "price",
];

const RECOMMENDATION_FORMAT = `Recommendation Summary: 
[Course Name] is [recommended/not recommended] because [1-2 key reasons]. 
The [investment/value proposition] of [price] provides [specific benefit]. This [beginner-friendly/advanced] course offers [unique feature].`;

const TEMPLATE_RULES = `
1. Use EXACTLY 50 words
2. Include course name and price
3. Use specified terminology only`;

const TEMPLATE = `You are a course recommendation expert. Analyze the courses and provide a EXACTLY 50-word recommendation using this strict format:

${RECOMMENDATION_FORMAT}

MUST follow these rules:${TEMPLATE_RULES}`;

evalite("Course Recommendation Feedback", {
  data: async () => {
    return [
      {
        input: {
          context: "Looking to start a career in digital marketing with no prior experience",
          products: [
            { name: "Digital Marketing Fundamentals", price: 299, specs: "12 weeks, Beginner Level" },
            { name: "Social Media Marketing Mastery", price: 399, specs: "8 weeks, Includes Certification" }
          ]
        }
      },
      {
        input: {
          context: "Experienced Python developer wanting to learn advanced ML concepts",
          products: [
            { name: "Advanced Python for ML", price: 599, specs: "16 weeks, Advanced Level" },
            { name: "Deep Learning Specialization", price: 699, specs: "20 weeks, Industry Projects" }
          ]
        }
      },
    ];
  },
  task: async (input) => {
    const start = performance.now();
    
    const result = await generateText({
      model: traceAISDKModel(cacheModel(openai("gpt-4o-mini"), storage)),
      prompt: JSON.stringify(input),
      system: TEMPLATE,
    });

    reportTrace({
      start,
      end: performance.now(),
      output: result.text,
      input,
      usage: {
        completionTokens: result.usage.completionTokens,
        promptTokens: result.usage.promptTokens,
      },
    });

    return result.text;
  },
  scorers: [
    createScorer({
      name: "Has Recommendation Summary",
      scorer: ({ output }: { output: string }) => {
        return output.toLowerCase().includes("recommendation summary") ? 1 : 0;
      },
    }),
    createScorer({
      name: "Word Count",
      scorer: ({ output }: { output: string }) => {
        const words = output.split(/\s+/).length;
        return words === 50 ? 1 : 0;
      },
    }),
    createScorer({
      name: "Required Phrases",
      scorer: ({ output }: { output: string }) => {
        const lowerOutput = output.toLowerCase();
        const foundPhrases = REQUIRED_PHRASES.filter(phrase => 
          lowerOutput.includes(phrase)
        );
        return foundPhrases.length / REQUIRED_PHRASES.length;
      },
    }),
    createScorer({
      name: "Format Adherence",
      scorer: ({ output }: { output: string }) => {
        return output.startsWith("Recommendation Summary:") &&
          output.includes(" because ") &&
          output.includes(" provides ") ? 1 : 0;
      },
    }),
  ],
});
