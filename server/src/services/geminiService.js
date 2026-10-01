import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeReport(reportText) {
  const prompt = `
You are an incident-report assistant.

Analyze the report below.

Return ONLY JSON in this exact format:

{
  "summary": "short summary",
  "tag": "bug"
}

Allowed tags:
bug
incident
question
feature
other

Report:
${reportText}
`;

  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `Calling Gemini with model: ${model}, attempt: ${attempt}`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        console.log(
          `Gemini response received from ${model}`
        );

        let text = response.text?.trim() || "";

        
        text = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          const result = JSON.parse(text);

          return {
            summary: result.summary || reportText,
            tag: result.tag || "other",
          };
        } catch (parseError) {
          console.error(
            "Failed to parse Gemini JSON:",
            parseError
          );

          return {
            summary: text || reportText,
            tag: "other",
          };
        }
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini failed with ${model}, attempt ${attempt}:`,
          error.message
        );

        if (
          error.status === 503 ||
          error.status === 429
        ) {
          await sleep(2000);
          continue;
        }

        break;
      }
    }
  }

  console.error(
    "All Gemini models failed:",
    lastError
  );

  throw lastError;
}