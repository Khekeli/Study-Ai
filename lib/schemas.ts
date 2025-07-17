import { z } from "zod";

export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths."
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on."
    ),
  explanation: z
    .string()
    .optional()
    .describe("Additional explanation for the answer"),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(45);

// Enhanced Theory Questions Schemas

// Difficulty level schema
export const difficultyLevelSchema = z.enum([
  "basic",
  "intermediate",
  "advanced",
]);

// Study mode schema
export const studyModeSchema = z.enum([
  "spaced_repetition",
  "active_recall",
  "concept_mapping",
  "standard",
]);

// Spaced repetition data schema
export const spacedRepetitionDataSchema = z.object({
  questionId: z.string(),
  easeFactor: z.number().min(1.3).max(2.5),
  interval: z.number().min(1),
  repetitions: z.number().min(0),
  nextReview: z.date(),
  lastReviewed: z.date(),
  performanceHistory: z.array(z.number().min(0).max(5)),
});

// Concept mapping schema
export const conceptMappingSchema = z.object({
  primaryConcepts: z.array(z.string()),
  secondaryConcepts: z.array(z.string()),
  prerequisites: z.array(z.string()),
  relatedQuestions: z.array(z.string()),
});

// Question metadata schema
export const questionMetadataSchema = z.object({
  createdAt: z.date(),
  source: z.string(),
  tags: z.array(z.string()),
  averageResponseTime: z.number().min(0),
  successRate: z.number().min(0).max(1),
  timesAttempted: z.number().min(0),
  lastAttempted: z.date().optional(),
});

// Enhanced theory question schema
export const enhancedTheoryQuestionSchema = questionSchema.extend({
  id: z.string(),
  difficulty: difficultyLevelSchema,
  concepts: z.array(z.string()),
  metadata: questionMetadataSchema,
  spacedRepetition: spacedRepetitionDataSchema,
  conceptMapping: conceptMappingSchema,
});

// Study mode configuration schema
export const studyModeConfigSchema = z.object({
  id: studyModeSchema,
  name: z.string(),
  description: z.string(),
  benefits: z.array(z.string()),
  icon: z.string(),
  color: z.string(),
});

// Active recall session schema
export const activeRecallSessionSchema = z.object({
  questionId: z.string(),
  mentalRetrievalTime: z.number().min(0),
  confidenceLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  selfAssessment: z.enum(["correct", "partial", "incorrect"]),
  actualPerformance: z.boolean(),
  retrievalAttempts: z.number().min(1),
});

// Concept relationship type schema
export const conceptRelationshipTypeSchema = z.enum([
  "prerequisite",
  "related",
  "example",
  "application",
]);

// Concept node schema
export const conceptNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  questions: z.array(z.string()),
  difficulty: z.number().min(0).max(1),
  masteryLevel: z.number().min(0).max(1),
});

// Concept relationship schema
export const conceptRelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: conceptRelationshipTypeSchema,
  strength: z.number().min(0).max(1),
});

// Concept map schema
export const conceptMapSchema = z.object({
  concepts: z.array(conceptNodeSchema),
  relationships: z.array(conceptRelationshipSchema),
});

// Learning recommendation schemas
export const recommendationTypeSchema = z.enum([
  "review",
  "practice",
  "concept_study",
  "difficulty_adjustment",
]);
export const recommendationPrioritySchema = z.enum(["high", "medium", "low"]);

export const learningRecommendationSchema = z.object({
  type: recommendationTypeSchema,
  priority: recommendationPrioritySchema,
  description: z.string(),
  suggestedActions: z.array(z.string()),
  targetConcepts: z.array(z.string()),
  estimatedTime: z.number().min(0),
});

// Performance metrics schema
export const performanceMetricsSchema = z.object({
  accuracy: z.number().min(0).max(1),
  speed: z.number().min(0),
  consistency: z.number().min(0).max(1),
  improvement: z.number(),
  streakLength: z.number().min(0),
  averageConfidence: z.number().min(1).max(5),
});

// Learning patterns schema
export const learningPatternsSchema = z.object({
  preferredDifficulty: difficultyLevelSchema,
  optimalSessionLength: z.number().min(1),
  bestPerformanceTime: z.string(),
  strugglingConcepts: z.array(z.string()),
  strongConcepts: z.array(z.string()),
  learningVelocity: z.number().min(0),
});

// Study progress schema
export const studyProgressSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  studyMode: studyModeSchema,
  questionsAttempted: z.number().min(0),
  questionsCorrect: z.number().min(0),
  averageResponseTime: z.number().min(0),
  difficultyProgression: z.array(difficultyLevelSchema),
  conceptsMastered: z.array(z.string()),
  weakAreas: z.array(z.string()),
  recommendations: z.array(learningRecommendationSchema),
  performanceMetrics: performanceMetricsSchema,
  activeRecallSessions: z.array(activeRecallSessionSchema),
});

// Session analytics schema
export const sessionAnalyticsSchema = z.object({
  sessionId: z.string(),
  performanceMetrics: performanceMetricsSchema,
  learningPatterns: learningPatternsSchema,
  conceptProgress: z.record(
    z.string(),
    z.object({
      masteryLevel: z.number().min(0).max(1),
      questionsAttempted: z.number().min(0),
      questionsCorrect: z.number().min(0),
      averageResponseTime: z.number().min(0),
      lastStudied: z.date(),
    })
  ),
  recommendations: z.object({
    nextStudyMode: studyModeSchema,
    focusAreas: z.array(z.string()),
    scheduledReviews: z.array(z.date()),
    difficultyAdjustment: z.enum(["increase", "decrease", "maintain"]),
  }),
  timeSpent: z.number().min(0),
  engagementScore: z.number().min(0).max(1),
});

// Study session state schema
export const studySessionStateSchema = z.object({
  currentMode: studyModeSchema,
  currentQuestionIndex: z.number().min(0),
  questionsInSession: z.array(z.string()),
  userAnswers: z.record(z.string(), z.number()),
  showExplanations: z.record(z.string(), z.boolean()),
  sessionStartTime: z.date(),
  isSessionComplete: z.boolean(),
  progress: studyProgressSchema,
});

// Enhanced theory questions props schema
export const enhancedTheoryQuestionsPropsSchema = z.object({
  title: z.string(),
  extractedText: z.string(),
  questions: z.array(enhancedTheoryQuestionSchema),
  clearPDF: z.function(),
  onSaveProgress: z.function().optional(),
  onSessionComplete: z.function().optional(),
  initialMode: studyModeSchema.optional(),
  userId: z.string().optional(),
});

// Array schemas for collections
export const enhancedTheoryQuestionsSchema = z.array(
  enhancedTheoryQuestionSchema
);
export const studyModeConfigsSchema = z.array(studyModeConfigSchema);
export const activeRecallSessionsSchema = z.array(activeRecallSessionSchema);
export const learningRecommendationsSchema = z.array(
  learningRecommendationSchema
);
