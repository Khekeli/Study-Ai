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

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content:
            `You are a teacher creating comprehensive multiple choice questions. Create ${numberOfQuestions || 45} detailed MCQ questions that test deep understanding, application, and analysis of the content. Each question object must have: question (string), options (array of exactly 4 strings), answer (one of 'A', 'B', 'C', 'D'), and explanation (string).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create ${numberOfQuestions || 45} comprehensive multiple choice questions based on this extracted text content. Focus on detailed understanding and application of concepts:\n\n${extractedText}`,
            },
          ],
        },
      ],
      schema: z.array(questionSchema), // Remove length constraint for streaming
      onFinish: ({ object }) => {
        console.log("MCQ generation finished, object:", object);
        console.log("MCQ object type:", typeof object);
        console.log("MCQ object is array:", Array.isArray(object));
        if (object) {
          console.log("MCQ object length:", object.length);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("MCQ API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate MCQ questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}