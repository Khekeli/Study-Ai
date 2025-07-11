import { z } from "zod";

// Flashcard specific schema
export const flashcardSchema = z.object({
  question: z.string(),
  answer: z.string().describe("The direct answer to the question - not a multiple choice letter"),
  explanation: z.string().optional().describe("Additional context or reasoning"),
  options: z.array(z.string()).optional().describe("Related concepts or alternative phrasings for context")
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const flashcardsSchema = z.array(flashcardSchema).length(45);

// Original quiz schema (keep existing)
export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths.",
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on.",
    ),
  explanation: z.string().optional().describe("Additional explanation for the answer"),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(45);