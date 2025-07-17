import { z } from "zod";

// Flashcard specific schema
export const flashcardSchema = z.object({
  question: z.string(),
  answer: z
    .string()
    .describe(
      "The direct answer to the question - not a multiple choice letter"
    ),
  explanation: z
    .string()
    .optional()
    .describe("Additional context or reasoning"),
  options: z
    .array(z.string())
    .optional()
    .describe("Related concepts or alternative phrasings for context"),
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

// Enhanced Theory Questions Types

// Difficulty levels for questions
export type DifficultyLevel = "basic" | "intermediate" | "advanced";

// Study modes available
export type StudyMode =
  | "spaced_repetition"
  | "active_recall"
  | "concept_mapping"
  | "standard";

// Spaced repetition data for SM-2 algorithm
export interface SpacedRepetitionData {
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed: Date;
  performanceHistory: number[];
}

// Concept mapping data
export interface ConceptMapping {
  primaryConcepts: string[];
  secondaryConcepts: string[];
  prerequisites: string[];
  relatedQuestions: string[];
}

// Question metadata
export interface QuestionMetadata {
  createdAt: Date;
  source: string;
  tags: string[];
  averageResponseTime: number;
  successRate: number;
  timesAttempted: number;
  lastAttempted?: Date;
}

// Enhanced theory question interface
export interface EnhancedTheoryQuestion extends Question {
  id: string;
  difficulty: DifficultyLevel;
  concepts: string[];
  metadata: QuestionMetadata;
  spacedRepetition: SpacedRepetitionData;
  conceptMapping: ConceptMapping;
}

// Study mode configuration
export interface StudyModeConfig {
  id: StudyMode;
  name: string;
  description: string;
  benefits: string[];
  icon: string;
  color: string;
}

// Active recall session data
export interface ActiveRecallSession {
  questionId: string;
  mentalRetrievalTime: number;
  confidenceLevel: 1 | 2 | 3 | 4 | 5;
  selfAssessment: "correct" | "partial" | "incorrect";
  actualPerformance: boolean;
  retrievalAttempts: number;
}

// Concept relationship types
export type ConceptRelationshipType =
  | "prerequisite"
  | "related"
  | "example"
  | "application";

// Concept node for mapping
export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  questions: string[];
  difficulty: number;
  masteryLevel: number;
}

// Concept relationship
export interface ConceptRelationship {
  from: string;
  to: string;
  type: ConceptRelationshipType;
  strength: number;
}

// Concept map structure
export interface ConceptMap {
  concepts: ConceptNode[];
  relationships: ConceptRelationship[];
}

// Learning recommendation types
export type RecommendationType =
  | "review"
  | "practice"
  | "concept_study"
  | "difficulty_adjustment";
export type RecommendationPriority = "high" | "medium" | "low";

// Learning recommendation
export interface LearningRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  description: string;
  suggestedActions: string[];
  targetConcepts: string[];
  estimatedTime: number;
}

// Performance metrics
export interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  consistency: number;
  improvement: number;
  streakLength: number;
  averageConfidence: number;
}

// Learning patterns
export interface LearningPatterns {
  preferredDifficulty: DifficultyLevel;
  optimalSessionLength: number;
  bestPerformanceTime: string;
  strugglingConcepts: string[];
  strongConcepts: string[];
  learningVelocity: number;
}

// Study progress tracking
export interface StudyProgress {
  userId?: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  studyMode: StudyMode;
  questionsAttempted: number;
  questionsCorrect: number;
  averageResponseTime: number;
  difficultyProgression: DifficultyLevel[];
  conceptsMastered: string[];
  weakAreas: string[];
  recommendations: LearningRecommendation[];
  performanceMetrics: PerformanceMetrics;
  activeRecallSessions: ActiveRecallSession[];
}

// Session analytics
export interface SessionAnalytics {
  sessionId: string;
  performanceMetrics: PerformanceMetrics;
  learningPatterns: LearningPatterns;
  conceptProgress: {
    [conceptId: string]: {
      masteryLevel: number;
      questionsAttempted: number;
      questionsCorrect: number;
      averageResponseTime: number;
      lastStudied: Date;
    };
  };
  recommendations: {
    nextStudyMode: StudyMode;
    focusAreas: string[];
    scheduledReviews: Date[];
    difficultyAdjustment: "increase" | "decrease" | "maintain";
  };
  timeSpent: number;
  engagementScore: number;
}

// Study session state
export interface StudySessionState {
  currentMode: StudyMode;
  currentQuestionIndex: number;
  questionsInSession: string[];
  userAnswers: { [questionId: string]: number };
  showExplanations: { [questionId: string]: boolean };
  sessionStartTime: Date;
  isSessionComplete: boolean;
  progress: StudyProgress;
}

// Enhanced theory questions props
export interface EnhancedTheoryQuestionsProps {
  title: string;
  extractedText: string;
  questions: EnhancedTheoryQuestion[];
  clearPDF: () => void;
  onSaveProgress?: (progress: StudyProgress) => void;
  onSessionComplete?: (analytics: SessionAnalytics) => void;
  initialMode?: StudyMode;
  userId?: string;
}
