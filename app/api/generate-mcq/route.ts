import { questionSchema } from "@/lib/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { extractedText, numberOfQuestions } = await req.json();
    
    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No extracted text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a dynamic schema based on numberOfQuestions
    const dynamicQuestionsSchema = z.array(questionSchema).min(1).max(numberOfQuestions || 100);

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content:
            `You are a teacher creating quiz questions for students. Create ${numberOfQuestions || 45} multiple choice questions that test understanding of the material. IMPORTANT REQUIREMENTS: 1) Questions must be organized sequentially according to the page order in the text - do NOT mix up questions from different pages 2) Each question should include the page number reference 3) Follow the natural flow and sequence of the content as it appears in the text 4) Each question should have: a) A clear, concise question with page reference b) Four multiple choice options (A, B, C, D) c) The correct answer (A, B, C, or D) d) An explanation that provides context and reasoning 5) Create challenging but fair questions that test comprehension, maintaining the sequential order of content.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create quiz questions based on this extracted text content. Each question should have 4 multiple choice options and test key concepts. CRITICAL: Organize questions sequentially by page number - start with content from the earliest pages and progress through to the latest pages:\n\n${extractedText}`,
            },
          ],
        },
      ],
      schema: questionSchema,
      output: "array",
      onFinish: ({ object }) => {
        console.log("Quiz generation finished, object:", object);
        const res = dynamicQuestionsSchema.safeParse(object);
        if (res.error) {
          console.error("Quiz validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log("Quiz validation successful");
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Quiz API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}