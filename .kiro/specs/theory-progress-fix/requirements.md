# Requirements Document

## Introduction

This feature addresses a bug in the theory question generation progress display. Currently, when theory questions are being generated, the loading indicators, progress percentage, and question counts are not displayed properly, unlike other question types (MCQ, Quiz, Flashcards) which show proper progress feedback to users.

## Requirements

### Requirement 1

**User Story:** As a student, I want to see progress indicators when theory questions are being generated, so that I know the system is working and can track the generation progress.

#### Acceptance Criteria

1. WHEN a user clicks the "Theory (Active recall)" button THEN the system SHALL show a loading spinner with "Generating..." text
2. WHEN theory questions are being generated THEN the system SHALL display a progress bar showing the percentage of completion
3. WHEN theory questions are being generated THEN the system SHALL show the count of questions generated (e.g., "Generated 5 of 30 questions")
4. WHEN theory question generation is complete THEN the system SHALL hide all progress indicators and display the theory questions interface
5. WHEN theory question generation fails THEN the system SHALL show appropriate error messages and hide progress indicators

### Requirement 2

**User Story:** As a student, I want the theory question generation progress to behave consistently with other question types, so that I have a uniform experience across all study modes.

#### Acceptance Criteria

1. WHEN theory questions are generating THEN the progress display SHALL match the format used for MCQ, Quiz, and Flashcard generation
2. WHEN theory questions are generating THEN the progress calculation SHALL be based on the number of questions requested
3. WHEN theory questions are generating THEN the progress bar SHALL update smoothly as questions are generated
4. WHEN theory questions are generating THEN the percentage display SHALL be accurate and match the progress bar
5. WHEN theory questions are generating THEN all generation buttons SHALL be disabled to prevent multiple simultaneous requests
