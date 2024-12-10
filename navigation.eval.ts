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

const PERSONA_TEMPLATES = {
  newInvestor: "You are a helpful financial advisor guiding a new investor. Focus on explaining basic concepts and avoiding risky investments.",
  techShopper: "You are a tech-savvy shopping assistant helping users find the right electronics. Focus on comparing features and value for money.",
  // Add more personas as needed
};

const NAVIGATION_FORMAT = `Navigation Guidance:
Current Page: [page]
Recommended Action: [what the user should do next]
Explanation: [why this action helps achieve their goal]
Next Steps: [1-2 specific navigation suggestions]`;

const TEMPLATE = `Analyze the user's browsing history and current page to provide navigation guidance.
Consider their goal and persona to make relevant suggestions.

${NAVIGATION_FORMAT}`;

evalite("Navigation Guidance", {
  data: async () => {
    return [
      {
        input: {
          persona: "newInvestor",
          currentPage: "/investment-products",
          browsingHistory: [
            { path: "/home", timestamp: "2024-03-20T10:00:00" },
            { path: "/getting-started", timestamp: "2024-03-20T10:02:00" }
          ],
          userGoal: "Start investing with $1000"
        }
      },
      {
        input: {
          persona: "techShopper",
          currentPage: "/laptops",
          browsingHistory: [
            { path: "/electronics", timestamp: "2024-03-20T14:00:00" },
            { path: "/compare-devices", timestamp: "2024-03-20T14:05:00" }
          ],
          userGoal: "Find a laptop for video editing under $2000"
        }
      }
    ];
  },
  task: async (input) => {
    const start = performance.now();
    
    const result = await generateText({
      model: traceAISDKModel(cacheModel(openai("gpt-4o-mini"), storage)),
      prompt: JSON.stringify(input),
      system: PERSONA_TEMPLATES[input.persona as keyof typeof PERSONA_TEMPLATES] + "\n\n" + TEMPLATE,
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
      name: "Guidance Relevance",
      scorer: ({ output, input }: { output: string, input: any }) => {
        return output.toLowerCase().includes(input.userGoal.toLowerCase()) ? 1 : 0;
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
      name: "Format Adherence",
      scorer: ({ output }: { output: string }) => {
        return output.startsWith("Navigation Guidance:") &&
          output.includes(" because ") &&
          output.includes(" provides ") ? 1 : 0;
      },
    }),
  ],
});
