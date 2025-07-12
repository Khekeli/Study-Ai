import { flashcardSchema } from "@/lib/types";
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
    const dynamicFlashcardsSchema = z.array(flashcardSchema).min(1).max(numberOfQuestions || 100);

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content:
            `You are a teacher creating flashcards for students. Create exactly ${numberOfQuestions || 45} flashcard questions that are perfect for memorization and review. 

CRITICAL: You must return a JSON array of flashcard objects. Each flashcard must have:
- question: string (the question text)
- answer: string (the answer text - NOT multiple choice letters)
- explanation: string (optional additional context)

IMPORTANT REQUIREMENTS: 
1) Questions must be organized sequentially according to the page order in the text
2) Each question should include the page number reference
3) Follow the natural flow and sequence of the content as it appears in the text
4) The answer field should contain the actual answer content as a string, not A/B/C/D choices
5) Create direct question-answer pairs suitable for flashcard study

You must return the result as a JSON array of flashcard objects.`,
        },
        {
          role: "user",
          content: `Create exactly ${numberOfQuestions || 45} flashcard-style questions based on this extracted text content. Each flashcard should have a clear question on one side and a detailed answer on the other side. Focus on key concepts, definitions, and important facts. 

CRITICAL: Organize questions sequentially by page number - start with content from the earliest pages and progress through to the latest pages. Include page references in both questions and answers.

Return the result as a JSON array of flashcard objects with question, answer, and explanation fields.

Text content:
${extractedText}`,
        },
      ],
      schema: dynamicFlashcardsSchema,
      onFinish: ({ object }) => {
        console.log("Flashcards generation finished, object:", object);
        console.log("Object type:", typeof object);
        console.log("Is array:", Array.isArray(object));
        
        if (!object) {
          console.error("Flashcards generation returned undefined object");
          return;
        }
        
        const res = dynamicFlashcardsSchema.safeParse(object);
        if (res.error) {
          console.error("Flashcards validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log("Flashcards validation successful, count:", object.length);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Flashcards API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}