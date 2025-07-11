import { flashcardSchema, flashcardsSchema } from "@/lib/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { extractedText } = await req.json();
    
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
            "You are a teacher creating flashcards for students. Create 45 flashcard questions that are perfect for memorization and review. IMPORTANT REQUIREMENTS: 1) Questions must be organized sequentially according to the page order in the text - do NOT mix up questions from different pages 2) Each question should include the page number reference (e.g., 'Page 12: What is...?' or include page number in the answer) 3) Follow the natural flow and sequence of the content as it appears in the text 4) Each flashcard should have: a) A clear, concise question with page reference b) A comprehensive answer that directly answers the question (NOT a multiple choice letter) with page number specified c) An optional explanation that provides additional context or reasoning 5) The answer field should contain the actual answer content as a string, not A/B/C/D choices 6) Create direct question-answer pairs suitable for flashcard study, maintaining the sequential order of content.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create flashcard-style questions based on this extracted text content. Each flashcard should have a clear question on one side and a detailed answer on the other side. Focus on key concepts, definitions, and important facts. CRITICAL: Organize questions sequentially by page number - start with content from the earliest pages and progress through to the latest pages. Include page references in both questions and answers:\n\n${extractedText}`,
            },
          ],
        },
      ],
      schema: flashcardSchema,
      output: "array",
      onFinish: ({ object }) => {
        console.log("Flashcards generation finished, object:", object);
        const res = flashcardsSchema.safeParse(object);
        if (res.error) {
          console.error("Flashcards validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log("Flashcards validation successful");
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