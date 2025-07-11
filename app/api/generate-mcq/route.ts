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
            "You are a teacher creating comprehensive multiple choice questions. Create 45 detailed MCQ questions that test deep understanding, application, and analysis of the content. IMPORTANT REQUIREMENTS: 1) Questions must be organized sequentially according to the page order in the text - do NOT mix up questions from different pages 2) Each question should include the page number reference (e.g., 'Page 15: Which of the following...?' or specify page number in the question/answer) 3) Follow the natural flow and sequence of the content as it appears in the text 4) Include questions that require critical thinking and application of concepts 5) Each option should be roughly equal in length and plausible 6) Generate very detailed answers that are broken down and easy to understand 7) The detailed explanations should include the page number reference 8) Each question must have exactly 4 options (A, B, C, D) and one correct answer 9) Maintain sequential organization from earliest to latest pages in the text.",
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
        const res = questionsSchema.safeParse(object);
        if (res.error) {
          console.error("MCQ validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log("MCQ validation successful");
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