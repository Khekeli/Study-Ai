import { questionSchema } from "@/lib/schemas";
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

    // Create dynamic schema based on numberOfQuestions
    const dynamicQuestionsSchema = z.array(questionSchema).min(1).max(numberOfQuestions || 45);

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content:
            `You are a teacher. Your job is to take extracted text content and create a multiple choice test with ${numberOfQuestions || 45} questions based on the content. Each option should be roughly equal in length. Focus on key concepts, important facts, and comprehensive understanding of the material.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create a multiple choice test based on this extracted text content:\n\n${extractedText}`,
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
    return new Response(JSON.stringify({ error: "Failed to generate quiz questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}