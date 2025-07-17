import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 150;

// Define the schema for answer evaluation
const answerEvaluationSchema = z.object({
  stars: z.enum(["1", "2", "3"]),
  verdict: z.enum(["correct", "partially_correct", "incorrect"]),
  explanation: z.string(),
  missing: z.array(z.string()),
  hits: z.array(z.string()),
  review_in_days: z.number().min(1).max(30),
});

export async function POST(req: Request) {
  try {
    const { question, expected_answer, student_answer, explanation } =
      await req.json();

    // Validate required fields
    if (!question || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!expected_answer || expected_answer.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Expected answer is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!student_answer || student_answer.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Student answer is required" }),
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
          content: `You are an expert educator evaluating student answers. Your task is to compare the student's answer to the expected answer and provide comprehensive, constructive feedback.

EVALUATION CRITERIA:
- **Stars**: Rate 1-3 stars based on overall correctness and completeness
  - 3 stars: Comprehensive, accurate answer covering all key points
  - 2 stars: Good understanding with some missing elements or minor errors
  - 1 star: Limited understanding, significant gaps, or major errors

- **Verdict**: Classify as "correct", "partially_correct", or "incorrect"
  - "correct": Student demonstrates complete understanding
  - "partially_correct": Student shows understanding but misses key elements
  - "incorrect": Student shows fundamental misunderstanding or completely wrong

- **Explanation**: Provide detailed, constructive feedback that:
  - Acknowledges what the student got right
  - Explains what was missing or incorrect
  - Offers guidance for improvement
  - Is encouraging and educational

- **Missing**: List specific critical elements the student failed to mention
- **Hits**: List key concepts the student correctly identified
- **Review in Days**: Suggest spaced repetition timing (1-30 days) based on:
  - 1-3 days: Major gaps or errors (needs frequent review)
  - 4-7 days: Partial understanding (moderate review needed)
  - 8-14 days: Good understanding with minor gaps
  - 15-30 days: Strong understanding (longer intervals)

IMPORTANT: You must respond with a JSON object matching this exact structure:
{
  "stars": "1" | "2" | "3",
  "verdict": "correct" | "partially_correct" | "incorrect",
  "explanation": "Detailed constructive feedback",
  "missing": ["Critical element 1", "Critical element 2"],
  "hits": ["Correct concept 1", "Correct concept 2"],
  "review_in_days": number between 1-30
}

Be fair but thorough in your evaluation. Focus on understanding rather than perfect wording.`,
        },
        {
          role: "user",
          content: `Please evaluate this student's answer:

**Question:** ${question}

**Expected Answer:** ${expected_answer}

**Student Answer:** ${student_answer}

${explanation ? `**Additional Context/Explanation:** ${explanation}` : ""}

Please provide a comprehensive evaluation following the specified format.`,
        },
      ],
      schema: answerEvaluationSchema,
      onFinish: ({ object }) => {
        console.log("Answer evaluation finished, object:", object);
        console.log("Answer evaluation finished, object type:", typeof object);

        if (!object) {
          console.error("Answer evaluation returned undefined object");
          return;
        }

        const res = answerEvaluationSchema.safeParse(object);
        if (res.error) {
          console.error(
            "Answer evaluation validation error:",
            res.error.errors
          );
          throw new Error(res.error.errors.map((e) => e.message).join("\n"));
        }

        // Additional validation for stars
        if (!["1", "2", "3"].includes(object.stars)) {
          console.error("Invalid stars value:", object.stars);
          throw new Error("Stars must be '1', '2', or '3'");
        }

        console.log(
          "Answer evaluation validation successful, stars:",
          object.stars,
          "verdict:",
          object.verdict
        );
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Answer evaluation API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to evaluate answer" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
