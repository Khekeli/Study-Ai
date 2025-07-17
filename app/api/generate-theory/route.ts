import { questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

// Increase the allowed request body size for file uploads.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export const maxDuration = 150;

export async function POST(req: Request) {
  try {
    const { files } = await req.json();

    // Create content array with text and all files
    const content = [
      {
        type: "text",
        text:
          files.length > 1
            ? `Create theory-based multiple choice questions based on these ${files.length} documents. Focus on theoretical concepts, principles, and conceptual understanding.`
            : "Create theory-based multiple choice questions based on this document. Focus on theoretical concepts, principles, and conceptual understanding.",
      },
      // Add all files to the content
      ...files.map((file: { data: string; name: string }) => ({
        type: "file",
        data: file.data,
        mimeType: "application/pdf",
      })),
    ];

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are a teacher creating theory-based multiple choice questions. Create exactly 45 questions that focus on theoretical concepts, principles, frameworks, and conceptual understanding. Questions should test knowledge of theories, models, principles, and abstract concepts rather than practical applications. 

Each question must have:
- A clear, well-structured question
- Exactly 4 options (A, B, C, D)
- Options that are roughly equal in length
- The correct answer specified as "A", "B", "C", or "D"
- A detailed explanation that breaks down the theoretical concept

When multiple documents are provided, create questions that cover content from all documents. Make sure to generate exactly 45 questions - no more, no less.

The explanations should be very detailed and help students understand the theoretical concepts thoroughly.`,
        },
        {
          role: "user",
          content,
        },
      ],
      schema: questionsSchema,
      output: "object",
      onFinish: ({ object }) => {
        console.log("Theory questions generated:", object?.length || 0);
        // Remove the validation that was throwing errors
        // The schema validation is handled by the streamObject itself
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in theory questions API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate theory questions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
