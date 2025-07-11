"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Home, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { gsap } from "gsap";

interface Flashcard {
  question: string;
  answer: string;
  explanation?: string;
  options?: string[];
}

interface FlashCardsProps {
  title: string;
  questions: Flashcard[];
  clearPDF: () => void;
}

export default function FlashCards({ title, questions, clearPDF }: FlashCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [referLaterCards, setReferLaterCards] = useState<Set<number>>(new Set());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);

  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const studyProgressRef = useRef<HTMLDivElement>(null);

  // Add debugging logs
  console.log("FlashCards component rendered");
  console.log("Questions:", questions);
  console.log("Questions length:", questions.length);
  console.log("Current index:", currentIndex);
  console.log("Title:", title);

  // Initialize GSAP animations
  useEffect(() => {
    if (!containerRef.current) return;

    // Kill any existing animations first
    gsap.killTweensOf([headerRef.current, progressRef.current, cardRef.current, controlsRef.current, studyProgressRef.current]);

    // Initial page load animation
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      onComplete: () => {
        // Ensure final state is set
        gsap.set([headerRef.current, progressRef.current, cardRef.current, controlsRef.current, studyProgressRef.current], {
          clearProps: "transform,opacity"
        });
      }
    });
    
    tl.set([headerRef.current, progressRef.current, cardRef.current, controlsRef.current, studyProgressRef.current], {
      opacity: 0,
      y: 30
    })
    .to(headerRef.current, { opacity: 1, y: 0, duration: 0.6 })
    .to(progressRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
    .to(cardRef.current, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
    .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
    .to(studyProgressRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.1");

    return () => {
      tl.kill();
    };
  }, []);

  // Animate card transitions with slide effect
  useEffect(() => {
    if (cardRef.current) {
      // Kill any existing animations
      gsap.killTweensOf(cardRef.current);
      
      const tl = gsap.timeline({ 
        defaults: { ease: "power2.out" },
        onComplete: () => {
          gsap.set(cardRef.current, { clearProps: "transform" });
        }
      });
      
      tl.fromTo(cardRef.current, 
        { x: 50, opacity: 0.8 },
        { x: 0, opacity: 1, duration: 0.5 }
      );

      return () => {
        tl.kill();
      };
    }
  }, [currentIndex]);

  // Animate progress updates
  useEffect(() => {
    if (progressRef.current) {
      // Kill any existing animations
      gsap.killTweensOf(progressRef.current);
      
      gsap.to(progressRef.current, {
        scale: 1.01,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(progressRef.current, { clearProps: "transform" });
        }
      });
    }
  }, [currentIndex]);

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false);
    setShowAnswer(false);
  }, [currentIndex]);

  // Early return if no questions
  if (!questions || questions.length === 0) {
    console.log("No questions available");
    return (
      <div className="min-h-screen w-full flex justify-center items-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-lg text-muted-foreground mb-6">No flashcards available</p>
          <Button onClick={clearPDF} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestions = isReviewMode ? reviewCards : questions;
  const currentQuestion = currentQuestions[currentIndex];
  
  // Safety check for currentQuestion
  if (!currentQuestion) {
    console.log("Current question is undefined");
    return (
      <div className="min-h-screen w-full flex justify-center items-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-lg text-muted-foreground mb-6">Error loading flashcard</p>
          <Button onClick={clearPDF} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      // Animate button press
      const nextButton = controlsRef.current?.querySelector('[data-button="next"]');
      if (nextButton) {
        gsap.killTweensOf(nextButton);
        gsap.to(nextButton, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.set(nextButton, { clearProps: "transform" });
          }
        });
      }

      setCurrentIndex(currentIndex + 1);
      // Reset states will be handled by useEffect
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Animate button press
      const prevButton = controlsRef.current?.querySelector('[data-button="previous"]');
      if (prevButton) {
        gsap.killTweensOf(prevButton);
        gsap.to(prevButton, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.set(prevButton, { clearProps: "transform" });
          }
        });
      }

      setCurrentIndex(currentIndex - 1);
      // Reset states will be handled by useEffect
    }
  };

  const handleFlip = () => {
    // Animate card flip interaction
    if (cardRef.current) {
      gsap.killTweensOf(cardRef.current);
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(cardRef.current, { clearProps: "transform" });
        }
      });
    }

    const newFlippedState = !isFlipped;
    const newShowAnswerState = !showAnswer;
    
    setIsFlipped(newFlippedState);
    setShowAnswer(newShowAnswerState);
    
    if (newShowAnswerState) {
      setStudiedCards(prev => new Set(prev).add(currentIndex));
    }
  };

  const handleReset = () => {
    // Animate reset action
    const resetButton = controlsRef.current?.querySelector('[data-button="reset"]');
    if (resetButton) {
      gsap.killTweensOf(resetButton);
      gsap.to(resetButton, {
        rotation: 360,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(resetButton, { clearProps: "transform" });
        }
      });
    }

    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setStudiedCards(new Set());
  };

  const handleReferLater = () => {
    // Animate refer later button
    const referButton = controlsRef.current?.querySelector('[data-button="refer-later"]');
    if (referButton) {
      gsap.killTweensOf(referButton);
      gsap.to(referButton, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(referButton, { clearProps: "transform" });
        }
      });
    }

    if (isReviewMode) {
      // In review mode, remove from refer later
      const originalIndex = questions.findIndex(q => q.question === currentQuestion.question);
      if (originalIndex !== -1) {
        setReferLaterCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(originalIndex);
          return newSet;
        });
        // Update review cards
        setReviewCards(prev => prev.filter((_, index) => index !== currentIndex));
        // Adjust current index if needed
        if (currentIndex >= reviewCards.length - 1) {
          setCurrentIndex(Math.max(0, reviewCards.length - 2));
        }
      }
    } else {
      // In normal mode, add to refer later
      setReferLaterCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentIndex)) {
          newSet.delete(currentIndex);
        } else {
          newSet.add(currentIndex);
        }
        return newSet;
      });
    }
  };

  const handleStartReview = () => {
    if (referLaterCards.size > 0) {
      const cardsToReview = Array.from(referLaterCards).map(index => questions[index]);
      setReviewCards(cardsToReview);
      setIsReviewMode(true);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowAnswer(false);
      setStudiedCards(new Set());
    }
  };

  const handleExitReview = () => {
    setIsReviewMode(false);
    setReviewCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const studiedCount = studiedCards.size;
  const isCurrentCardMarked = isReviewMode 
    ? false 
    : referLaterCards.has(currentIndex);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-900"
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div 
          ref={headerRef}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400 leading-tight">
              {isReviewMode ? `Review: ${title}` : title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {currentQuestions.length} • {studiedCount} studied
              {!isReviewMode && referLaterCards.size > 0 && (
                <span> • {referLaterCards.size} marked for review</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isReviewMode && referLaterCards.size > 0 && (
              <Button
                onClick={handleStartReview}
                variant="outline"
                size="sm"
                className="border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Review ({referLaterCards.size})
              </Button>
            )}
            {isReviewMode && (
              <Button
                onClick={handleExitReview}
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
              >
                Exit Review
              </Button>
            )}
            <Button
              onClick={clearPDF}
              variant="outline"
              size="sm"
              className="border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-900/20 shrink-0"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div ref={progressRef} className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2">
            <div className="h-full bg-pink-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </Progress>
        </div>

        {/* Flashcard */}
        <div className="flex justify-center px-2 sm:px-0">
          <div 
            ref={cardRef}
            className="relative w-full max-w-2xl h-96 sm:h-[28rem]"
          >
            <motion.div
              className="relative w-full h-full cursor-pointer"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              onClick={handleFlip}
              style={{ 
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              {/* Front of card - Question */}
              <Card 
                className="absolute inset-0 w-full h-full border-pink-300 dark:border-pink-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{
                  backfaceVisibility: 'hidden'
                }}
              >
                <CardHeader className="text-center space-y-4 p-6 sm:p-8">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center">
                      <Eye className="h-6 w-6 sm:h-7 sm:w-7 text-pink-500 dark:text-pink-400" />
                    </div>
                    {!isReviewMode && isCurrentCardMarked && (
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                        <BookmarkCheck className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-pink-600 dark:text-pink-400">
                    Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center text-center p-6 sm:p-10">
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </CardContent>
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Click to reveal answer
                  </p>
                </div>
              </Card>

              {/* Back of card - Answer */}
              <Card 
                className="absolute inset-0 w-full h-full border-green-300 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(-180deg)'
                }}
              >
                <CardHeader className="text-center space-y-4 p-6 sm:p-8">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <EyeOff className="h-6 w-6 sm:h-7 sm:w-7 text-green-500 dark:text-green-400" />
                    </div>
                    {!isReviewMode && isCurrentCardMarked && (
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                        <BookmarkCheck className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-green-600 dark:text-green-400">
                    Answer
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-6 sm:p-10 space-y-4 sm:space-y-6">
                  <div className="w-full max-w-lg">
                    <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-4">
                      {currentQuestion.answer}
                    </p>
                    {currentQuestion.explanation && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Explanation:
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Click to flip back
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div 
          ref={controlsRef}
          className="flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <Button
            data-button="previous"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-900/20 w-full sm:w-auto transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Button
              data-button="reset"
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-900/20 flex-1 sm:flex-initial transition-all duration-200"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              data-button="refer-later"
              onClick={handleReferLater}
              variant="outline"
              size="sm"
              className={`${
                isReviewMode 
                  ? 'border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20' 
                  : isCurrentCardMarked 
                    ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20' 
                    : 'border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20'
              } flex-1 sm:flex-initial transition-all duration-200`}
            >
              {isReviewMode ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Remove
                </>
              ) : isCurrentCardMarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Marked
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Refer Later
                </>
              )}
            </Button>
            <Button
              data-button="flip"
              onClick={handleFlip}
              variant="outline"
              size="sm"
              className="border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-900/20 flex-1 sm:flex-initial transition-all duration-200"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </Button>
          </div>

          <Button
            data-button="next"
            onClick={handleNext}
            disabled={currentIndex === currentQuestions.length - 1}
            variant="outline"
            size="sm"
            className="border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-900/20 w-full sm:w-auto transition-all duration-200"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Study Progress */}
        <div ref={studyProgressRef} className="text-center space-y-3 px-2 sm:px-0">
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <span>Cards studied: {studiedCount}</span>
            <span>Remaining: {currentQuestions.length - studiedCount}</span>
            {!isReviewMode && referLaterCards.size > 0 && (
              <span>For review: {referLaterCards.size}</span>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(studiedCount / currentQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}