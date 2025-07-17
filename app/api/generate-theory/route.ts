import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 150;

// Define the schema for active recall study resources
const activeRecallSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        questionType: z
          .enum(["explain", "compare", "analyze", "apply", "evaluate"])
          .optional(),
      })
    )
    .min(1),
  key_definitions: z.record(z.string()).optional(),
  recommended_visuals: z.array(z.string()).optional(),
  study_tips: z.array(z.string()).optional(),
  common_misconceptions: z
    .array(
      z.object({
        misconception: z.string(),
        correction: z.string(),
      })
    )
    .optional(),
});

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

    const result = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are an expert educator creating active recall questions and comprehensive study resources. Your goal is to help students deeply understand and remember concepts through active recall techniques.

Generate a comprehensive study resource that includes:

1. **Active Recall Questions**: Create exactly ${numberOfQuestions || 15} questions that vary in difficulty and encourage deep thinking. Questions should:
   - Test understanding rather than memorization
   - Require students to explain, analyze, compare, or apply concepts
   - Progress from basic recall to higher-order thinking
   - Include a mix of question types (explain, compare, analyze, apply, evaluate)
   - Each question should have a detailed ideal answer that demonstrates complete understanding

2. **Key Definitions**: Provide clear, concise definitions for important terms and concepts (as an object with term as key and definition as value)

3. **Recommended Visuals**: Suggest specific diagrams, charts, or visual aids that would enhance understanding (as an array of strings)

4. **Study Tips**: Include specific strategies for mastering this material (as an array of strings)

5. **Common Misconceptions**: Identify frequent misunderstandings and provide corrections (as an array of objects with misconception and correction fields)

IMPORTANT: You must respond with a JSON object matching this exact structure:
{
  "questions": [
    {
      "question": "Question text that encourages deep thinking",
      "answer": "Comprehensive answer that serves as a study guide",
      "difficulty": "easy|medium|hard",
      "questionType": "explain|compare|analyze|apply|evaluate"
    }
  ],
  "key_definitions": {
    "Term": "Definition"
  },
  "recommended_visuals": ["Visual suggestion"],
  "study_tips": ["Study tip"],
  "common_misconceptions": [
    {
      "misconception": "Common wrong belief",
      "correction": "Correct understanding"
    }
  ]
}

Focus on creating questions that encourage students to actively retrieve and apply knowledge rather than passively recognize information. Make answers detailed enough to serve as comprehensive study guides.`,
        },
        {
          role: "user",
          content: `Create ${numberOfQuestions || 15} active recall questions and comprehensive study resources based on this extracted text content. Focus on deep understanding and active recall techniques:\n\n${extractedText}`,
        },
      ],
      schema: activeRecallSchema,
      onFinish: ({ object }) => {
        console.log("Active recall generation finished, object:", object);
        console.log(
          "Active recall generation finished, object type:",
          typeof object
        );

        if (!object) {
          console.error("Active recall generation returned undefined object");
          return;
        }

        const res = activeRecallSchema.safeParse(object);
        if (res.error) {
          console.error("Active recall validation error:", res.error.errors);
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }
        console.log(
          "Active recall validation successful, questions count:",
          object.questions?.length || 0
        );
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Active recall API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate active recall questions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
