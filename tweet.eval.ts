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
const noHashtagsScorer = createScorer("No Hashtags", (input: { output: string }) => {
  return input.output.includes("#") ? 0 : 1;
});

evalite("Content generation", {
  data: async () => {
    return [
      {
        input: "Write a TypeScript tweet",
      },
      {
        input: "Write a tweet about TypeScript template literal types.",
      },
      {
        input: 'Write a tweet about "TypeScript is a superset of JavaScript."',
      },
      {
        input: `Write an article about TypeScript's basic types, like string and number.`,
      },
    ];
  },
  task: async (input) => {
    const start = performance.now();
    
    const result = await generateText({
      model: traceAISDKModel(cacheModel(openai("gpt-4o-mini"), storage)),
      prompt: input,
      system: `
        You are a helpful social media assistant.
        You will be asked to write a tweet on a given topic.
        Return only the tweet.
        Do not use emojis.
        Do not use hashtags.
        Use code examples if needed.
      `,
    });

    reportTrace({
      start,
      end: performance.now(),
      output: result.text,
      prompt: [
        {
          role: "user",
          content: input,
        },
      ],
      usage: {
        completionTokens: result.usage?.completionTokens ?? 0,
        promptTokens: result.usage?.promptTokens ?? 0,
      },
    });

    return result.text;

  },
  scorers: [noHashtagsScorer],
});