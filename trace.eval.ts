import { evalite } from "evalite";
import { reportTrace } from "evalite/traces";
import { cacheModel } from "./cache-model";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { traceAISDKModel } from "evalite/ai-sdk";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { Levenshtein } from "autoevals";

const storage = createStorage({
  driver: (fsDriver as any)({
    base: "./llm-cache.local",
    }),
});

evalite("My Eval", {
  data: async () => {
    return [{ input: "Hello", expected: "Hello World" }];
  },
  task: async (input) => {
    // Track the start time
    const start = performance.now();

    // Call our LLM
    const result = await generateText({
      model: traceAISDKModel(cacheModel(openai("gpt-4o-mini"), storage)),
      prompt: input,
      system: `
        You are always completing Hello with the word World and return the combined string.
        `,
      });

    // Report the trace once it's finished
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

    // Return the output
    return result.text;
  },
  scorers: [Levenshtein],
});