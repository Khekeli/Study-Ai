import { questionSchema } from "@/lib/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 150;

export async function POST(req: Request) {
  try {
    const { extractedText, numberOfQuestions } = await req.json();

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No extracted text provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a dynamic schema based on numberOfQuestions
    const dynamicQuestionsSchema = z
      .array(questionSchema)
      .length(numberOfQuestions || 45);

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are a teacher creating quiz questions for students. Create exactly ${numberOfQuestions || 45} multiple choice questions that test understanding of the material. 
            
            IMPORTANT: You must respond with a JSON array of questions. Each question object must have:
            - question: string (the question text)
            - options: array of exactly 4 strings (A, B, C, D options)
            - answer: string (must be "A", "B", "C", or "D")
            - explanation: string (optional explanation)
            
            Example format:
            [
              {
                "question": "What is the main concept discussed?", 
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "A",
                "explanation": "This is correct because..."
              }
            ]`,
        },
        {
          role: "user",
          content: `Create ${numberOfQuestions || 45} quiz questions based on this extracted text content. Each question should have 4 multiple choice options and test key concepts:\n\n${extractedText}`,
        },
      ],
      schema: dynamicQuestionsSchema,
      onFinish: ({ object }) => {
        console.log("Quiz generation finished, object:", object);
        console.log("Quiz generation finished, object type:", typeof object);
        console.log(
          "Quiz generation finished, is array:",
          Array.isArray(object)
        );

        if (!object) {
          console.error("Quiz generation returned undefined object");
          return;
        }

        const res = dynamicQuestionsSchema.safeParse(object);
        if (res.error) {
          console.error("Quiz validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log(
          "Quiz validation successful, questions count:",
          object.length
        );
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
