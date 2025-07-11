import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { question, correctAnswer, options } = await req.json();
    
    if (!question || !correctAnswer) {
      return Response.json(
        { error: "Question and correct answer are required" },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: "You are a helpful teacher explaining multiple choice questions. Provide clear, concise explanations that help students understand why the correct answer is right and why other options might be wrong. Keep explanations focused and educational, around 2-3 sentences."
        },
        {
          role: "user",
          content: `Please explain this multiple choice question:

Question: ${question}

${options ? `Options: ${options.map((opt: string, idx: number) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(', ')}` : ''}

Correct Answer: ${correctAnswer}

Please explain why this is the correct answer and provide any relevant context to help understand the concept.`
        }
      ],
    });

    return Response.json({
      explanation: result.text
    });

  } catch (error) {
    console.error('Error generating explanation:', error);
    return Response.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}