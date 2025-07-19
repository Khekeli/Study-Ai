import { flashcardSchema } from "@/lib/types";
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
    const dynamicFlashcardsSchema = z
      .array(flashcardSchema)
      .length(numberOfQuestions || 45);

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are a teacher creating flashcards for students based on PROVIDED TEXT CONTENT. You must create exactly ${numberOfQuestions || 45} flashcard questions that are perfect for memorization and review of the SPECIFIC CONTENT provided by the user.

CRITICAL: You must ONLY use information from the text content provided by the user. Do not add external knowledge or information not present in the text.

IMPORTANT REQUIREMENTS: 
1) Questions must be organized sequentially according to the page order in the provided text - do NOT mix up questions from different pages 
2) Each question should include the page number reference if available in the text (e.g., 'Page 12: What is...?' or include page number in the answer) 
3) Follow the natural flow and sequence of the content as it appears in the provided text 
4) Each flashcard should have: a) A clear, concise question with page reference based on the provided text b) A comprehensive answer that directly answers the question (NOT a multiple choice letter) extracted from the provided text c) An optional explanation that provides additional context or reasoning from the provided text
5) The answer field should contain the actual answer content as a string, not A/B/C/D choices 
6) Create direct question-answer pairs suitable for flashcard study, maintaining the sequential order of content from the provided text
7) Focus on key concepts, definitions, formulas, processes, and important facts from the provided text only`,
        },
        {
          role: "user",
          content: `Based on the following extracted text content, create exactly ${numberOfQuestions || 45} flashcard-style questions. Each flashcard should have a clear question on one side and a detailed answer on the other side. Focus on key concepts, definitions, important facts, formulas, processes, and any other significant information found in the text.

CRITICAL REQUIREMENTS:
1. READ AND ANALYZE the entire text content provided below
2. Organize questions sequentially by page number - start with content from the earliest pages and progress through to the latest pages
3. Include page references in both questions and answers if available in the text (e.g., "Page 5: What is..." or "Answer from Page 5:")
4. Extract key concepts, definitions, formulas, processes, and facts directly from the text
5. Create questions that test understanding of the material presented in the text
6. Each answer should be comprehensive and directly based on the information in the text
7. Do not use any external knowledge - only use what is in the provided text

Return the result as a JSON array of flashcard objects with question, answer, and explanation fields.

EXTRACTED TEXT CONTENT TO ANALYZE:
${extractedText}

Please analyze this text thoroughly and create ${numberOfQuestions || 45} flashcards based on the content above. Make sure every flashcard is derived from the actual text content provided.`,
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
    return new Response(
      JSON.stringify({ error: "Failed to generate flashcards" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
