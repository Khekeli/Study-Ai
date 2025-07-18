import { questionSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 150;

// Helper function to split text into chunks
function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 15000
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + ".");
        currentChunk = trimmedSentence;
      } else {
        // If single sentence is too long, split by words
        const words = trimmedSentence.split(" ");
        let wordChunk = "";
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxChunkSize) {
            wordChunk += (wordChunk ? " " : "") + word;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + ".");
  }

  return chunks;
}

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

    console.log("Extracted text length:", extractedText.length);

    // For very long texts, use only a portion to avoid timeouts and ensure quality
    let textToUse = extractedText;
    if (extractedText.length > 20000) {
      console.log(
        "Text is very long, using first portion for better MCQ generation"
      );
      const chunks = splitTextIntoChunks(extractedText, 15000);
      // Use the first chunk or combine first two chunks if they're small
      textToUse = chunks[0];
      if (chunks.length > 1 && chunks[0].length < 10000) {
        textToUse += "\n\n" + chunks[1];
      }
      console.log("Using text portion of length:", textToUse.length);
    }

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are a teacher creating comprehensive multiple choice questions. Create ${numberOfQuestions || 45} detailed MCQ questions that test deep understanding, application, and analysis of the content. Each question object must have: question (string), options (array of exactly 4 strings), answer (one of 'A', 'B', 'C', 'D'), and explanation (string). IMPORTANT: Always return a valid array of question objects, even if you can only generate fewer questions than requested.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create ${numberOfQuestions || 45} comprehensive multiple choice questions based on this extracted text content. Focus on detailed understanding and application of concepts:\n\n${textToUse}`,
            },
          ],
        },
      ],
      schema: z.array(questionSchema),
      onFinish: ({ object }) => {
        console.log("MCQ generation finished, object:", object);
        console.log("MCQ object type:", typeof object);
        console.log("MCQ object is array:", Array.isArray(object));
        console.log("Extracted text length:", extractedText.length);
        if (object) {
          console.log("MCQ object length:", object.length);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("MCQ API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate MCQ questions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
