import { questionsSchema } from "@/lib/schemas";
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
            "You are a teacher creating comprehensive multiple choice questions. Create 45 detailed MCQ questions that test deep understanding, application, and analysis of the content. ",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create comprehensive multiple choice questions based on this extracted text content. Focus on detailed understanding and application of concepts. CRITICAL: Organize questions sequentially by page number - start with content from the earliest pages and progress through to the latest pages. Include page references in questions and detailed answers:\n\n${extractedText}`,
            },
          ],
        },
      ],
      schema: questionsSchema,
      onFinish: ({ object }) => {
        console.log("MCQ generation finished, object:", object);
        console.log("MCQ generation finished, object type:", typeof object);
        console.log("MCQ generation finished, is array:", Array.isArray(object));
        
        // Only validate if object exists and is not undefined
        if (object) {
          const res = questionsSchema.safeParse(object);
          if (res.error) {
            console.error("MCQ validation error:", res.error.errors);
            throw new Error(res.error.errors.map((e) => e.message).join("\n"));
          }
          console.log("MCQ validation successful, questions count:", Array.isArray(object) ? object.length : 'not an array');
        } else {
          console.log("MCQ generation finished but object is undefined");
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