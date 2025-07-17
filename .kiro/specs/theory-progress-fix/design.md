# Design Document

## Overview

This design addresses the bug where theory question generation does not display proper progress indicators. The issue stems from the theory generation using a different data structure than other question types, which causes the progress calculation functions to not work correctly.

## Architecture

The current progress system works by:

1. Tracking partial question arrays as they're generated
2. Calculating progress based on the length of partial arrays vs target count
3. Displaying progress bars and counters based on these calculations

The theory generation returns a different object structure that includes nested question arrays, which breaks the existing progress calculation logic.

## Components and Interfaces

### Current Progress Calculation

The existing `calculateProgress` function expects either:

- An array of questions (for MCQ, Quiz)
- An array of flashcards (for Flashcards)

But theory generation returns:

```typescript
{
  questions: Array<{question: string, answer: string, ...}>,
  key_definitions?: Record<string, string>,
  recommended_visuals?: string[],
  study_tips?: string[],
  common_misconceptions?: Array<{misconception: string, correction: string}>
}
```

### Required Changes

1. **Update Progress Calculation**: Modify `calculateProgress` to handle theory data structure
2. **Update Progress Display Logic**: Ensure theory progress is included in `currentProgress` calculation
3. **Update Partial Data Handling**: Modify `getCurrentPartialQuestions` to handle theory data

## Data Models

### Theory Progress Calculation

```typescript
const calculateTheoryProgress = (partialTheory: any): number => {
  if (!partialTheory || !partialTheory.questions) return 0;
  const validQuestions = Array.isArray(partialTheory.questions)
    ? partialTheory.questions.filter(
        (q) =>
          q && typeof q.question === "string" && typeof q.answer === "string"
      )
    : [];
  return Math.min((validQuestions.length / numberOfQuestions) * 100, 100);
};
```

### Updated Current Progress Logic

```typescript
const currentProgress = isLoading
  ? progress
  : isLoadingFlashCards
    ? flashCardProgress
    : isLoadingMCQ
      ? mcqProgress
      : isLoadingTheory
        ? theoryProgress // This was missing
        : 0;
```

## Error Handling

- Ensure theory progress calculation handles undefined/null data gracefully
- Maintain backward compatibility with existing question types
- Provide fallback progress display if theory data structure is unexpected

## Testing Strategy

### Unit Testing

- Test theory progress calculation with various data states
- Verify progress display updates correctly during theory generation
- Test edge cases with malformed theory data

### Integration Testing

- Verify theory progress works alongside other question type progress
- Test progress display consistency across all generation types
- Validate progress indicators hide properly when generation completes
