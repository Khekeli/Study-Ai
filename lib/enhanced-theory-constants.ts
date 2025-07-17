import { StudyModeConfig, StudyMode } from "./types";

// Default study mode configurations
export const DEFAULT_STUDY_MODES: StudyModeConfig[] = [
  {
    id: "standard",
    name: "Standard Mode",
    description: "Traditional question-answer format with immediate feedback",
    benefits: [
      "Quick assessment of knowledge",
      "Immediate feedback and explanations",
      "Familiar learning format",
    ],
    icon: "BookOpen",
    color: "blue",
  },
  {
    id: "spaced_repetition",
    name: "Spaced Repetition",
    description:
      "Scientifically-optimized review schedule for long-term retention",
    benefits: [
      "Maximizes long-term memory retention",
      "Reduces study time through optimal scheduling",
      "Adapts to your learning pace",
    ],
    icon: "Clock",
    color: "green",
  },
  {
    id: "active_recall",
    name: "Active Recall",
    description: "Mental retrieval practice before seeing answer options",
    benefits: [
      "Strengthens memory retrieval pathways",
      "Improves confidence in knowledge",
      "Identifies knowledge gaps effectively",
    ],
    icon: "Brain",
    color: "purple",
  },
  {
    id: "concept_mapping",
    name: "Concept Mapping",
    description: "Explore relationships and connections between concepts",
    benefits: [
      "Builds comprehensive understanding",
      "Shows knowledge connections",
      "Improves conceptual thinking",
    ],
    icon: "Network",
    color: "orange",
  },
];

// Default SM-2 algorithm parameters
export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 1,
  SECOND_INTERVAL: 6,
  EASE_FACTOR_ADJUSTMENT: 0.1,
  DIFFICULTY_WEIGHT: 0.08,
  DIFFICULTY_WEIGHT_SQUARED: 0.02,
  PERFORMANCE_HISTORY_LIMIT: 10,
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LOW_ACCURACY: 0.6,
  HIGH_ACCURACY: 0.8,
  MINIMUM_CONFIDENCE: 1,
  MAXIMUM_CONFIDENCE: 5,
  OPTIMAL_RESPONSE_TIME: 30000, // 30 seconds in milliseconds
  MASTERY_THRESHOLD: 0.8,
  CONSISTENCY_THRESHOLD: 0.7,
};

// Session configuration defaults
export const SESSION_DEFAULTS = {
  MAX_QUESTIONS_PER_SESSION: 45,
  MIN_QUESTIONS_PER_SESSION: 5,
  DEFAULT_SESSION_LENGTH: 20, // minutes
  BREAK_REMINDER_INTERVAL: 15, // minutes
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds in milliseconds
};

// Difficulty progression rules
export const DIFFICULTY_PROGRESSION = {
  BASIC_TO_INTERMEDIATE_THRESHOLD: 0.8,
  INTERMEDIATE_TO_ADVANCED_THRESHOLD: 0.85,
  REGRESSION_THRESHOLD: 0.5,
  CONSECUTIVE_CORRECT_FOR_PROGRESSION: 3,
  CONSECUTIVE_INCORRECT_FOR_REGRESSION: 2,
};

// Concept extraction patterns
export const CONCEPT_PATTERNS = {
  TECHNICAL_TERMS_MIN_LENGTH: 4,
  MAX_CONCEPTS_PER_QUESTION: 5,
  STOP_WORDS: [
    "what",
    "when",
    "where",
    "which",
    "would",
    "could",
    "should",
    "this",
    "that",
    "these",
    "those",
    "they",
    "them",
    "their",
    "with",
    "from",
    "into",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "through",
    "during",
    "before",
    "after",
  ],
};

// Learning recommendation templates
export const RECOMMENDATION_TEMPLATES = {
  REVIEW: {
    HIGH_PRIORITY:
      "Review these concepts immediately - they're critical for your understanding",
    MEDIUM_PRIORITY: "Consider reviewing these concepts when you have time",
    LOW_PRIORITY: "These concepts could benefit from occasional review",
  },
  PRACTICE: {
    HIGH_PRIORITY: "Focus your practice sessions on these challenging areas",
    MEDIUM_PRIORITY: "Include these concepts in your regular practice",
    LOW_PRIORITY:
      "Light practice on these concepts will help maintain proficiency",
  },
  CONCEPT_STUDY: {
    HIGH_PRIORITY: "Deep dive into these fundamental concepts",
    MEDIUM_PRIORITY: "Explore the connections between these concepts",
    LOW_PRIORITY: "Browse related materials for these concepts when available",
  },
  DIFFICULTY_ADJUSTMENT: {
    INCREASE: "You're ready for more challenging questions in this area",
    DECREASE: "Let's focus on building a stronger foundation first",
    MAINTAIN: "Continue at your current level - you're making good progress",
  },
};

// Analytics calculation weights
export const ANALYTICS_WEIGHTS = {
  ACCURACY_WEIGHT: 0.4,
  SPEED_WEIGHT: 0.2,
  CONSISTENCY_WEIGHT: 0.2,
  IMPROVEMENT_WEIGHT: 0.2,
  CONFIDENCE_WEIGHT: 0.1,
  ENGAGEMENT_WEIGHT: 0.1,
};

// Color schemes for different study modes
export const STUDY_MODE_COLORS = {
  standard: {
    primary: "blue-600",
    secondary: "blue-100",
    accent: "blue-50",
    text: "blue-800",
  },
  spaced_repetition: {
    primary: "green-600",
    secondary: "green-100",
    accent: "green-50",
    text: "green-800",
  },
  active_recall: {
    primary: "purple-600",
    secondary: "purple-100",
    accent: "purple-50",
    text: "purple-800",
  },
  concept_mapping: {
    primary: "orange-600",
    secondary: "orange-100",
    accent: "orange-50",
    text: "orange-800",
  },
};

// Default question metadata
export const DEFAULT_QUESTION_METADATA = {
  tags: [] as string[],
  averageResponseTime: 0,
  successRate: 0,
  timesAttempted: 0,
  source: "ai_generated" as const,
};

// Default concept mapping
export const DEFAULT_CONCEPT_MAPPING = {
  primaryConcepts: [] as string[],
  secondaryConcepts: [] as string[],
  prerequisites: [] as string[],
  relatedQuestions: [] as string[],
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_QUESTION_FORMAT: "Question format is invalid or incomplete",
  MISSING_REQUIRED_FIELDS: "Required fields are missing from the question data",
  INVALID_PERFORMANCE_SCORE: "Performance score must be between 0 and 5",
  SESSION_NOT_FOUND: "Study session could not be found",
  INSUFFICIENT_DATA: "Insufficient data to generate recommendations",
  CALCULATION_ERROR: "Error occurred during performance calculations",
};

// Success messages
export const SUCCESS_MESSAGES = {
  SESSION_SAVED: "Study session saved successfully",
  PROGRESS_UPDATED: "Learning progress updated",
  RECOMMENDATIONS_GENERATED: "New learning recommendations available",
  DIFFICULTY_ADJUSTED:
    "Question difficulty has been adjusted based on your performance",
};

// Time constants
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
};
