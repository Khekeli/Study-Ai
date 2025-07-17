import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  EnhancedTheoryQuestion,
  Question,
  SpacedRepetitionData,
  DifficultyLevel,
  StudyMode,
  QuestionMetadata,
  ConceptMapping,
  PerformanceMetrics,
  StudyProgress,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhanced Theory Questions Utilities

/**
 * Converts a basic Question to an EnhancedTheoryQuestion with default values
 */
export function enhanceQuestion(
  question: Question,
  index: number,
  extractedText?: string
): EnhancedTheoryQuestion {
  const now = new Date();
  const questionId = `question_${index}_${Date.now()}`;

  return {
    ...question,
    id: questionId,
    difficulty: inferDifficulty(question),
    concepts: extractConcepts(question, extractedText),
    metadata: {
      createdAt: now,
      source: extractedText ? "ai_generated" : "manual",
      tags: [],
      averageResponseTime: 0,
      successRate: 0,
      timesAttempted: 0,
    },
    spacedRepetition: {
      questionId,
      easeFactor: 2.5, // Default SM-2 ease factor
      interval: 1,
      repetitions: 0,
      nextReview: now,
      lastReviewed: now,
      performanceHistory: [],
    },
    conceptMapping: {
      primaryConcepts: [],
      secondaryConcepts: [],
      prerequisites: [],
      relatedQuestions: [],
    },
  };
}

/**
 * Infers difficulty level based on question characteristics
 */
export function inferDifficulty(question: Question): DifficultyLevel {
  const text = question.question.toLowerCase();
  const explanation = question.explanation?.toLowerCase() || "";

  // Basic indicators
  const basicKeywords = ["what", "who", "when", "where", "define", "identify"];
  const intermediateKeywords = ["how", "why", "explain", "describe", "compare"];
  const advancedKeywords = [
    "analyze",
    "evaluate",
    "synthesize",
    "critique",
    "justify",
  ];

  const hasBasic = basicKeywords.some((keyword) => text.includes(keyword));
  const hasIntermediate = intermediateKeywords.some((keyword) =>
    text.includes(keyword)
  );
  const hasAdvanced = advancedKeywords.some((keyword) =>
    text.includes(keyword)
  );

  // Length and complexity indicators
  const isLongQuestion = question.question.length > 150;
  const hasComplexExplanation = explanation.length > 200;

  if (hasAdvanced || (isLongQuestion && hasComplexExplanation)) {
    return "advanced";
  } else if (hasIntermediate || isLongQuestion) {
    return "intermediate";
  } else {
    return "basic";
  }
}

/**
 * Extracts potential concepts from question text
 */
export function extractConcepts(
  question: Question,
  extractedText?: string
): string[] {
  const text =
    `${question.question} ${question.explanation || ""}`.toLowerCase();
  const concepts: string[] = [];

  // Simple concept extraction based on capitalized words and technical terms
  const words = text.split(/\s+/);
  const technicalTerms = words.filter(
    (word) =>
      word.length > 4 &&
      /^[a-z]+$/.test(word) &&
      !["what", "when", "where", "which", "would", "could", "should"].includes(
        word
      )
  );

  // Add unique technical terms as concepts
  technicalTerms.forEach((term) => {
    if (!concepts.includes(term)) {
      concepts.push(term);
    }
  });

  return concepts.slice(0, 5); // Limit to 5 concepts per question
}

/**
 * Calculates next review date using SM-2 algorithm
 */
export function calculateNextReview(
  spacedRepetition: SpacedRepetitionData,
  performance: number // 0-5 scale
): SpacedRepetitionData {
  const { easeFactor, interval, repetitions } = spacedRepetition;

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (performance >= 3) {
    // Correct answer
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect answer
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor
  newEaseFactor =
    easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    ...spacedRepetition,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
    lastReviewed: new Date(),
    performanceHistory: [
      ...spacedRepetition.performanceHistory,
      performance,
    ].slice(-10), // Keep last 10
  };
}

/**
 * Calculates performance metrics from study progress
 */
export function calculatePerformanceMetrics(
  progress: StudyProgress
): PerformanceMetrics {
  const accuracy =
    progress.questionsAttempted > 0
      ? progress.questionsCorrect / progress.questionsAttempted
      : 0;

  const speed =
    progress.averageResponseTime > 0
      ? 1 / (progress.averageResponseTime / 1000) // Questions per second
      : 0;

  // Calculate consistency based on performance variation
  const consistency =
    progress.activeRecallSessions.length > 1
      ? calculateConsistency(
          progress.activeRecallSessions.map((s) => s.actualPerformance)
        )
      : 0;

  // Calculate improvement trend
  const improvement = calculateImprovement(progress.activeRecallSessions);

  // Calculate streak length
  const streakLength = calculateStreakLength(progress.activeRecallSessions);

  // Calculate average confidence
  const averageConfidence =
    progress.activeRecallSessions.length > 0
      ? progress.activeRecallSessions.reduce(
          (sum, s) => sum + s.confidenceLevel,
          0
        ) / progress.activeRecallSessions.length
      : 0;

  return {
    accuracy,
    speed,
    consistency,
    improvement,
    streakLength,
    averageConfidence,
  };
}

/**
 * Calculates consistency score from performance array
 */
function calculateConsistency(performances: boolean[]): number {
  if (performances.length < 2) return 0;

  const correctCount = performances.filter((p) => p).length;
  const accuracy = correctCount / performances.length;

  // Calculate variance from expected performance
  const variance =
    performances.reduce((sum, p) => {
      const diff = (p ? 1 : 0) - accuracy;
      return sum + diff * diff;
    }, 0) / performances.length;

  // Convert variance to consistency score (0-1, higher is more consistent)
  return Math.max(0, 1 - variance * 4);
}

/**
 * Calculates improvement trend from active recall sessions
 */
function calculateImprovement(sessions: any[]): number {
  if (sessions.length < 3) return 0;

  // Take recent sessions and compare with earlier ones
  const recentSessions = sessions.slice(-5);
  const earlierSessions = sessions.slice(0, Math.min(5, sessions.length - 5));

  if (earlierSessions.length === 0) return 0;

  const recentAccuracy =
    recentSessions.filter((s) => s.actualPerformance).length /
    recentSessions.length;
  const earlierAccuracy =
    earlierSessions.filter((s) => s.actualPerformance).length /
    earlierSessions.length;

  return recentAccuracy - earlierAccuracy;
}

/**
 * Calculates current streak length
 */
function calculateStreakLength(sessions: any[]): number {
  let streak = 0;

  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].actualPerformance) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generates a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determines the optimal study mode based on performance history
 */
export function recommendStudyMode(progress: StudyProgress): StudyMode {
  const { accuracy } = calculatePerformanceMetrics(progress);

  if (accuracy < 0.6) {
    return "active_recall"; // Focus on retrieval practice for low accuracy
  } else if (accuracy > 0.8) {
    return "spaced_repetition"; // Use spaced repetition for maintenance
  } else {
    return "concept_mapping"; // Use concept mapping for understanding
  }
}

/**
 * Formats time duration in a human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculates mastery level for a concept based on performance
 */
export function calculateMasteryLevel(
  questionsAttempted: number,
  questionsCorrect: number,
  averageResponseTime: number
): number {
  if (questionsAttempted === 0) return 0;

  const accuracy = questionsCorrect / questionsAttempted;
  const speedFactor = Math.min(1, 30000 / averageResponseTime); // Normalize to 30 seconds

  // Combine accuracy and speed for mastery level
  return Math.min(1, accuracy * 0.7 + speedFactor * 0.3);
}
