"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StudyTimer from "@/components/StudyTimer";
import { Loader2 } from "lucide-react";

interface TheoryQuestion {
  question: string;
  answer: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "explain" | "compare" | "analyze" | "apply" | "evaluate";
}

interface TheoryData {
  questions: TheoryQuestion[];
  key_definitions?: Record<string, string>;
  recommended_visuals?: string[];
  study_tips?: string[];
  common_misconceptions?: Array<{
    misconception: string;
    correction: string;
  }>;
}

interface TheoryQuestionsProps {
  title?: string;
  theoryData: TheoryData;
  clearPDF: () => void;
}

export default function TheoryQuestions({
  title = "Theory Questions",
  theoryData,
  clearPDF,
}: TheoryQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerMode, setAnswerMode] = useState("text"); // 'text' or 'audio'
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [comparison, setComparison] = useState<{
    stars: string;
    verdict: "correct" | "partially_correct" | "incorrect";
    explanation: string;
    missing: string[];
    hits: string[];
    review_in_days: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // New state for tracking poor performance and review mode
  const [poorPerformanceQuestions, setPoorPerformanceQuestions] = useState<
    number[]
  >([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showReviewOptions, setShowReviewOptions] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<number[]>([]);
  const [reviewCurrentIndex, setReviewCurrentIndex] = useState(0);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const paperRef = useRef(null);
  const questionSectionRef = useRef(null);
  const answerSectionRef = useRef(null);
  const headerRef = useRef(null);
  const answerModeRef = useRef(null);
  const inputSectionRef = useRef(null);
  const actionButtonsRef = useRef(null);
  const comparisonRef = useRef(null);
  const studyResourcesRef = useRef(null);
  const reviewModalRef = useRef(null);
  const gsapRef = useRef<any>(null);

  // Use the actual theory data passed as props
  const questions = theoryData?.questions || [];

  // Initialize GSAP animations
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("gsap").then(({ gsap }) => {
        gsapRef.current = gsap;

        // Initial page load animation
        const tl = gsap.timeline();

        // Header animation
        if (headerRef.current) {
          tl.fromTo(
            headerRef.current,
            { y: -50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
          );
        }

        // Paper interface animation
        tl.fromTo(
          paperRef.current,
          { scale: 0.95, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        );

        // Question section animation
        if (questionSectionRef.current) {
          tl.fromTo(
            questionSectionRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
            "-=0.4"
          );
        }
      });
    }
  }, []);

  // Animate sections when they appear/change
  useEffect(() => {
    if (gsapRef.current) {
      // Animate answer mode toggle
      if (answerModeRef.current) {
        gsapRef.current.fromTo(
          answerModeRef.current,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }

      // Animate input section
      if (inputSectionRef.current) {
        gsapRef.current.fromTo(
          inputSectionRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 }
        );
      }

      // Animate action buttons
      if (actionButtonsRef.current) {
        gsapRef.current.fromTo(
          actionButtonsRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.2 }
        );
      }
    }
  }, [answerMode, currentQuestion]);

  // Animate answer section when it appears
  useEffect(() => {
    if (showAnswer && gsapRef.current && answerSectionRef.current) {
      gsapRef.current.fromTo(
        answerSectionRef.current,
        { y: 30, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }
      );
    }
  }, [showAnswer]);

  // Animate comparison section when it appears
  useEffect(() => {
    if (comparison && gsapRef.current && comparisonRef.current) {
      gsapRef.current.fromTo(
        comparisonRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.2 }
      );
    }
  }, [comparison]);

  // Animate study resources when they appear
  useEffect(() => {
    if (showExplanation && gsapRef.current && studyResourcesRef.current) {
      gsapRef.current.fromTo(
        studyResourcesRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [showExplanation]);

  // Animate review modal when it appears
  useEffect(() => {
    if (showReviewOptions && gsapRef.current && reviewModalRef.current) {
      gsapRef.current.fromTo(
        reviewModalRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, [showReviewOptions]);

  const handleAnswerReveal = async () => {
    if (isTransitioning || isValidating) return;

    setIsValidating(true);

    try {
      await validateAnswer();
    } catch (error) {
      console.error("Error validating answer:", error);
      setIsValidating(false);
    }
  };

  const validateAnswer = async () => {
    try {
      const response = await fetch("/api/validate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: current?.question,
          expected_answer: current?.answer,
          student_answer: userAnswer,
          explanation: "", // We don't need to pass explanation since API will generate it
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streamed response properly
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedData = "";
      let validationResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedData += chunk;
        console.log("Received chunk:", chunk);
      }

      // After reading all chunks, try to parse the complete response
      console.log("Complete accumulated data:", accumulatedData);

      // Split by lines and try to find the final JSON object
      const lines = accumulatedData.split("\n");

      // Look for the final complete JSON object (usually the last meaningful line)
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;

        let parsed = null;

        // Try different parsing strategies
        // Strategy 1: AI SDK stream format "0:{json}"
        if (line.startsWith("0:")) {
          try {
            const jsonStr = line.substring(2).trim();
            parsed = JSON.parse(jsonStr);
            console.log("Parsed AI SDK format:", parsed);
          } catch (e) {
            console.log("Failed to parse AI SDK format:", e);
          }
        }
        // Strategy 2: Direct JSON object
        else if (line.startsWith("{") && line.endsWith("}")) {
          try {
            parsed = JSON.parse(line);
            console.log("Parsed direct JSON:", parsed);
          } catch (e) {
            console.log("Failed to parse direct JSON:", e);
          }
        }
        // Strategy 3: Look for JSON within the line
        else if (line.includes("{") && line.includes("}")) {
          try {
            const jsonStart = line.indexOf("{");
            const jsonEnd = line.lastIndexOf("}") + 1;
            const jsonStr = line.substring(jsonStart, jsonEnd);
            parsed = JSON.parse(jsonStr);
            console.log("Parsed extracted JSON:", parsed);
          } catch (e) {
            console.log("Failed to parse extracted JSON:", e);
          }
        }

        // Validate the parsed result
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.stars === "string" &&
          parsed.verdict &&
          parsed.explanation
        ) {
          validationResult = parsed;
          console.log("Found valid validation result:", validationResult);
          break;
        }
      }

      // If no valid result found in lines, try parsing the entire accumulated data
      if (!validationResult) {
        try {
          // Try to find and extract the last complete JSON object from the entire response
          const jsonMatches = accumulatedData.match(
            /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
          );
          if (jsonMatches && jsonMatches.length > 0) {
            // Try the last match first (most likely to be complete)
            for (let i = jsonMatches.length - 1; i >= 0; i--) {
              try {
                const parsed = JSON.parse(jsonMatches[i]);
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  typeof parsed.stars === "string" &&
                  parsed.verdict &&
                  parsed.explanation
                ) {
                  validationResult = parsed;
                  console.log(
                    "Found valid result from regex match:",
                    validationResult
                  );
                  break;
                }
              } catch (e) {
                console.log("Failed to parse regex match:", e);
              }
            }
          }
        } catch (e) {
          console.log("Failed to extract JSON with regex:", e);
        }
      }

      console.log("Final validation result:", validationResult);

      if (validationResult) {
        setComparison(validationResult);
        setShowAnswer(true);

        // Track poor performance (2 stars or below) and remove from poor performance if 3 stars
        const stars = parseInt(validationResult.stars);
        const questionIndex = isReviewMode
          ? reviewQuestions[reviewCurrentIndex]
          : currentQuestion;

        if (stars <= 2) {
          setPoorPerformanceQuestions((prev) => {
            if (!prev.includes(questionIndex)) {
              return [...prev, questionIndex];
            }
            return prev;
          });
        } else if (stars === 3) {
          // Remove from poor performance if they got 3 stars
          setPoorPerformanceQuestions((prev) =>
            prev.filter((index) => index !== questionIndex)
          );
        }

        // Check if this is the last question in normal mode
        const isLastQuestion =
          !isReviewMode && currentQuestion === questions.length - 1;

        // Fade back in with answer content
        if (gsapRef.current) {
          gsapRef.current.to(paperRef.current, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.inOut",
            onComplete: () => {
              setIsTransitioning(false);
              setIsValidating(false);

              // Show review options immediately if this is the last question
              if (isLastQuestion) {
                setTimeout(() => {
                  setShowReviewOptions(true);
                }, 500); // Small delay for better UX
              }
            },
          });
        } else {
          setIsTransitioning(false);
          setIsValidating(false);

          // Show review options immediately if this is the last question
          if (isLastQuestion) {
            setTimeout(() => {
              setShowReviewOptions(true);
            }, 500);
          }
        }
      } else {
        throw new Error("No valid response received");
      }
    } catch (error) {
      console.error("Error validating answer:", error);

      // Show error state - no dummy data
      setComparison({
        stars: "1",
        verdict: "incorrect",
        explanation:
          "Unable to validate your answer due to a technical issue. Please check your connection and try again.",
        missing: [],
        hits: [],
        review_in_days: 1,
      });
      setShowAnswer(true);

      if (gsapRef.current) {
        gsapRef.current.to(paperRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }

      setIsTransitioning(false);
      setIsValidating(false);
    }
  };

  // Helper functions for review mode
  const startReviewMode = () => {
    if (poorPerformanceQuestions.length > 0) {
      setReviewQuestions([...poorPerformanceQuestions]);
      setIsReviewMode(true);
      setReviewCurrentIndex(0);
      setCurrentQuestion(poorPerformanceQuestions[0]);
      setShowReviewOptions(false);
      setUserAnswer("");
      setShowAnswer(false);
      setComparison(null);
      setShowExplanation(false);
      setIsTransitioning(false);
    }
  };

  const exitReview = () => {
    setIsReviewMode(false);
    setShowReviewOptions(false);
    clearPDF();
  };

  const handleTimerComplete = (seconds: number) => {
    setCompletionTime(seconds);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const nextQuestion = () => {
    // Add subtle exit animation before transitioning
    if (gsapRef.current && questionSectionRef.current) {
      gsapRef.current.to(questionSectionRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Reset states after exit animation
          setUserAnswer("");
          setShowAnswer(false);
          setComparison(null);
          setShowExplanation(false);
          setIsTransitioning(false);

          if (isReviewMode) {
            // In review mode, navigate through review questions
            if (reviewCurrentIndex < reviewQuestions.length - 1) {
              const nextIndex = reviewCurrentIndex + 1;
              setReviewCurrentIndex(nextIndex);
              setCurrentQuestion(reviewQuestions[nextIndex]);

              // Animate in new question
              gsapRef.current.fromTo(
                questionSectionRef.current,
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
              );
            } else {
              // Finished reviewing all poor performance questions
              const stillPoorQuestions = reviewQuestions.filter(
                (questionIndex) =>
                  poorPerformanceQuestions.includes(questionIndex)
              );

              if (stillPoorQuestions.length > 0) {
                setReviewQuestions(stillPoorQuestions);
                setReviewCurrentIndex(0);
                setCurrentQuestion(stillPoorQuestions[0]);

                gsapRef.current.fromTo(
                  questionSectionRef.current,
                  { x: 50, opacity: 0 },
                  { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
                );
              } else {
                setShowReviewOptions(true);
              }
            }
          } else {
            // Normal mode navigation
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1);

              // Animate in new question
              gsapRef.current.fromTo(
                questionSectionRef.current,
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
              );
            } else {
              // Finished all questions, check if there are poor performance questions
              if (poorPerformanceQuestions.length > 0) {
                setShowReviewOptions(true);
              }
            }
          }
        },
      });
    } else {
      // Fallback without animation
      setUserAnswer("");
      setShowAnswer(false);
      setComparison(null);
      setShowExplanation(false);
      setIsTransitioning(false);

      if (isReviewMode) {
        if (reviewCurrentIndex < reviewQuestions.length - 1) {
          const nextIndex = reviewCurrentIndex + 1;
          setReviewCurrentIndex(nextIndex);
          setCurrentQuestion(reviewQuestions[nextIndex]);
        } else {
          const stillPoorQuestions = reviewQuestions.filter((questionIndex) =>
            poorPerformanceQuestions.includes(questionIndex)
          );
          if (stillPoorQuestions.length > 0) {
            setReviewQuestions(stillPoorQuestions);
            setReviewCurrentIndex(0);
            setCurrentQuestion(stillPoorQuestions[0]);
          } else {
            setShowReviewOptions(true);
          }
        }
      } else {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          if (poorPerformanceQuestions.length > 0) {
            setShowReviewOptions(true);
          }
        }
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);

          // Convert to base64 and send to transcription API
          // setIsTranscribing is already set to true when stopping recording
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64Audio = (reader.result as string).split(",")[1];

                const response = await fetch("/api/transcribe", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ audioData: base64Audio }),
                });

                if (response.ok) {
                  const data = await response.json();
                  // Extract text from the transcript
                  if (data.transcript && data.transcript.length > 0) {
                    const transcribedText = data.transcript
                      .map((utterance: any) => utterance.text)
                      .join(" ");
                    setUserAnswer(transcribedText);
                  } else {
                    setUserAnswer("No speech detected in the recording.");
                  }
                } else {
                  console.error("Transcription failed");
                  setUserAnswer(
                    "Failed to transcribe audio. Please try again."
                  );
                }
              } catch (error) {
                console.error("Error transcribing audio:", error);
                setUserAnswer("Error transcribing audio. Please try again.");
              } finally {
                // Only set transcribing to false after the actual transcription is complete
                setIsTranscribing(false);
              }
            };
            reader.readAsDataURL(audioBlob);
          } catch (error) {
            console.error("Error setting up file reader:", error);
            setUserAnswer("Error processing audio. Please try again.");
            setIsTranscribing(false);
          }

          // Stop all tracks to release the microphone
          stream.getTracks().forEach((track) => track.stop());
        };

        setMediaRecorder(recorder);
        setAudioChunks([]);
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Unable to access microphone. Please check your permissions.");
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setIsRecording(false);
        // Set transcribing state immediately when stopping recording
        setIsTranscribing(true);
      }
    }
  };

  const togglePlayback = () => {
    if (recordedAudioUrl) {
      if (!isPlaying) {
        const audio = new Audio(recordedAudioUrl);
        audio.play();
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          console.error("Error playing audio");
        };
      } else {
        // If we want to pause, we'd need to store the audio element reference
        setIsPlaying(false);
      }
    }
  };

  const resetAnswer = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setComparison(null);
    setShowExplanation(false);
    setIsTransitioning(false);

    // Clean up audio resources
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setIsRecording(false);
    setIsPlaying(false);
    setIsTranscribing(false);

    // Stop any ongoing recording
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  };

  const current = questions[currentQuestion];

  // Early return if no questions available
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 to-purple-50/30 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-pink-600">
              No Theory Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No theory questions were generated.
            </p>
            <Button
              onClick={clearPDF}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono flex flex-col justify-center items-center">
      {/* Header */}
      <div
        ref={headerRef}
        className="w-full max-w-4xl flex justify-between items-center mb-16"
      >
        <div className="flex items-center space-x-4">
          <Button
            onClick={clearPDF}
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-white hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          <span className="text-xl">
            {isReviewMode
              ? `${reviewCurrentIndex + 1} / ${reviewQuestions.length} (Review)`
              : `${currentQuestion + 1} / ${questions.length}`}
          </span>
        </div>

        <div className="text-2xl font-bold tracking-wider text-center">
          <span className="block">{title}</span>
          <div className="flex items-center justify-center gap-4 mt-4">
            <StudyTimer
              className="text-white"
              onFinalTime={handleTimerComplete}
            />
            <div className="flex gap-2">
              {isReviewMode && (
                <Badge variant="destructive" className="text-xs">
                  REVIEW MODE
                </Badge>
              )}
              {current?.difficulty && (
                <Badge
                  variant={
                    current.difficulty === "easy"
                      ? "secondary"
                      : current.difficulty === "medium"
                        ? "default"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {current.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            // If on last question and answered, show review options
            if (
              !isReviewMode &&
              currentQuestion >= questions.length - 1 &&
              showAnswer
            ) {
              setShowReviewOptions(true);
            } else {
              nextQuestion();
            }
          }}
          disabled={
            (!isReviewMode &&
              currentQuestion >= questions.length - 1 &&
              !showAnswer) ||
            (isReviewMode &&
              reviewCurrentIndex >= reviewQuestions.length - 1 &&
              !showAnswer)
          }
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">
            {!isReviewMode &&
            currentQuestion >= questions.length - 1 &&
            showAnswer ? (
              <BookOpen />
            ) : (
              "≫"
            )}
          </span>
        </button>
      </div>

      {/* Main Interface */}
      <div className="max-w-4xl w-full">
        {/* Paper Interface */}
        <div
          ref={paperRef}
          className="bg-black border-2 border-white rounded-lg p-8 shadow-2xl transform-gpu relative"
          style={{
            boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.1)",
            transform: "perspective(1000px) rotateX(2deg)",
          }}
        >
          {/* Loading Overlay */}
          {isValidating && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                <p className="text-white text-lg">Validating your answer...</p>
                <p className="text-gray-400 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}

          {/* Question and Input Section */}
          {!showAnswer && (
            <div ref={questionSectionRef}>
              {/* Question Section */}
              <div className="mb-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">
                    Question {currentQuestion + 1}
                    {isReviewMode && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        REVIEW
                      </Badge>
                    )}
                    {current?.questionType && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {current.questionType}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-lg leading-relaxed mb-4">
                    {current?.question}
                  </p>
                </div>
              </div>

              {/* Answer Mode Toggle */}
              <div ref={answerModeRef} className="mb-8">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAnswerMode("text")}
                    className={`px-4 py-2 border transition-colors ${
                      answerMode === "text"
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-gray-600 hover:border-white"
                    }`}
                  >
                    Text Answer
                  </button>
                  <button
                    onClick={() => setAnswerMode("audio")}
                    className={`px-4 py-2 border transition-colors ${
                      answerMode === "audio"
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-gray-600 hover:border-white"
                    }`}
                  >
                    Audio Answer
                  </button>
                </div>
              </div>

              {/* Answer Input Section */}
              <div ref={inputSectionRef} className="mb-10">
                {answerMode === "text" ? (
                  <div className="space-y-4">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full h-32 bg-black border border-gray-600 rounded p-4 text-white placeholder-gray-400 focus:border-white focus:outline-none resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center space-x-2 px-4 py-2 border rounded transition-colors ${
                          isRecording
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-black border-gray-600 text-white hover:border-white"
                        }`}
                      >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                        <span>
                          {isRecording ? "Stop Recording" : "Start Recording"}
                        </span>
                      </button>

                      {userAnswer && (
                        <button
                          onClick={togglePlayback}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded hover:border-white transition-colors"
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                          <span>{isPlaying ? "Pause" : "Play"}</span>
                        </button>
                      )}
                    </div>

                    {isRecording && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span>Recording...</span>
                      </div>
                    )}

                    {isTranscribing && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Transcribing audio...</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-blue-500/30">
                          <div className="flex justify-center mb-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-blue-500/30 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          </div>
                          <p className="text-blue-400 font-medium">
                            Processing your audio...
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Converting speech to text
                          </p>
                        </div>
                      </div>
                    )}

                    {userAnswer &&
                      answerMode === "audio" &&
                      !isTranscribing && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 border border-green-500/30 rounded-lg shadow-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <h4 className="text-sm font-semibold text-green-400">
                              Transcribed Text:
                            </h4>
                          </div>
                          <p className="text-gray-100 text-base leading-relaxed bg-gray-950/50 p-3 rounded border border-gray-700">
                            {userAnswer}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            ✓ Audio successfully converted to text. You can now
                            validate your answer.
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div ref={actionButtonsRef} className="flex space-x-4 mb-10">
                <button
                  onClick={handleAnswerReveal}
                  disabled={
                    (!userAnswer && answerMode === "text") ||
                    isTransitioning ||
                    isValidating
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-white text-black rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {isValidating
                      ? "Validating..."
                      : isTransitioning
                        ? "Loading..."
                        : "Validate Answer"}
                  </span>
                </button>

                <button
                  onClick={resetAnswer}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-600 rounded hover:border-white transition-colors"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}

          {/* Answer Section */}
          {showAnswer && (
            <div ref={answerSectionRef} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">
                  Correct Answer
                </h2>
                <div className="text-base leading-relaxed mb-8 text-gray-300 space-y-6 bg-gray-950 p-6 rounded-lg border border-gray-800">
                  {current.answer.split("\n").map((paragraph, index) => {
                    if (paragraph.trim() === "") return null;

                    // Format the paragraph with bold text for key terms
                    const formattedParagraph = paragraph
                      .replace(
                        /^\*\*([^*]+):\*\*/gm,
                        '<h3 class="text-xl font-bold text-white mb-4 underline decoration-2 decoration-gray-600">$1:</h3>'
                      )
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-gray-200 font-medium">$1</strong>'
                      )
                      .replace(
                        /\*(.*?)\*/g,
                        '<em class="text-gray-300 italic">$1</em>'
                      )
                      .replace(
                        /`(.*?)`/g,
                        '<code class="bg-gray-900/60 px-2 py-1 rounded text-gray-300 font-mono text-sm">$1</code>'
                      )
                      .replace(/^\*\s+/gm, "• ");

                    return (
                      <p
                        key={index}
                        className="mb-6"
                        dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                      />
                    );
                  })}
                </div>
              </div>

              {comparison && (
                <div
                  ref={comparisonRef}
                  className="bg-gray-900 p-6 rounded border border-gray-700 mt-8"
                >
                  {/* Stars Rating */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex space-x-1">
                      {[1, 2, 3].map((star) => (
                        <span
                          key={star}
                          className={`text-2xl ${
                            star <= parseInt(comparison.stars)
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      ({comparison.stars}/3 stars)
                    </span>
                  </div>

                  {/* Verdict */}
                  <div className="flex items-center space-x-2 mb-4">
                    {comparison.verdict === "correct" ? (
                      <Check className="text-green-400" size={20} />
                    ) : comparison.verdict === "partially_correct" ? (
                      <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                        <span className="text-black text-xs font-bold">!</span>
                      </div>
                    ) : (
                      <X className="text-red-400" size={20} />
                    )}
                    <span
                      className={`font-bold text-lg ${
                        comparison.verdict === "correct"
                          ? "text-green-400"
                          : comparison.verdict === "partially_correct"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {comparison.verdict === "correct"
                        ? "Correct!"
                        : comparison.verdict === "partially_correct"
                          ? "Partially Correct"
                          : "Needs Improvement"}
                    </span>
                  </div>

                  {/* AI Explanation */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-white mb-2">Feedback:</h4>
                    <p className="text-gray-300">{comparison.explanation}</p>
                  </div>

                  {/* What you got right */}
                  {comparison.hits && comparison.hits.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-400 mb-2 flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        What you got right:
                      </h4>
                      <ul className="list-disc ml-6 space-y-1">
                        {comparison.hits.map((hit, index) => (
                          <li key={index} className="text-green-300 text-sm">
                            {hit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What was missing */}
                  {comparison.missing && comparison.missing.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-400 mb-2 flex items-center">
                        <X className="w-4 h-4 mr-2" />
                        What was missing:
                      </h4>
                      <ul className="list-disc ml-6 space-y-1">
                        {comparison.missing.map((miss, index) => (
                          <li key={index} className="text-red-300 text-sm">
                            {miss}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Review recommendation */}
                  <div className="mb-4 p-3 bg-gray-800 rounded">
                    <p className="text-blue-300 text-sm">
                      💡 Recommended review: {comparison.review_in_days} days
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowExplanation(true)}
                      className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
                    >
                      Study Resources
                    </button>

                    <button
                      onClick={resetAnswer}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-600 rounded hover:border-white transition-colors"
                    >
                      <RotateCcw size={16} />
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Detailed Explanation Modal */}
              {showExplanation && (
                <div
                  ref={studyResourcesRef}
                  className="bg-gray-900 p-6 rounded border border-gray-700 mt-6"
                >
                  <h3 className="text-xl font-bold mb-4 text-white">
                    Study Resources
                  </h3>
                  <div className="space-y-6 text-gray-300">
                    {/* Key Definitions */}
                    {theoryData?.key_definitions &&
                      Object.keys(theoryData.key_definitions).length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Key Definitions
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(theoryData.key_definitions).map(
                              ([term, definition]) => (
                                <div
                                  key={term}
                                  className="border-l-2 border-gray-600 pl-4"
                                >
                                  <strong className="text-white">
                                    {term}:
                                  </strong>{" "}
                                  {definition}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Study Tips */}
                    {theoryData?.study_tips &&
                      theoryData.study_tips.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                            <Lightbulb className="w-5 h-5 mr-2" />
                            Study Tips
                          </h4>
                          <ul className="list-disc ml-6 space-y-2">
                            {theoryData.study_tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Common Misconceptions */}
                    {theoryData?.common_misconceptions &&
                      theoryData.common_misconceptions.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Common Misconceptions
                          </h4>
                          <div className="space-y-3">
                            {theoryData.common_misconceptions.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-800 p-3 rounded"
                                >
                                  <div className="text-red-400 font-medium mb-1">
                                    ❌ Misconception: {item.misconception}
                                  </div>
                                  <div className="text-green-400">
                                    ✅ Correction: {item.correction}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Recommended Visuals */}
                    {theoryData?.recommended_visuals &&
                      theoryData.recommended_visuals.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-white">
                            Recommended Visuals
                          </h4>
                          <ul className="list-disc ml-6 space-y-1">
                            {theoryData.recommended_visuals.map(
                              (visual, index) => (
                                <li key={index} className="text-blue-300">
                                  {visual}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  <button
                    onClick={() => setShowExplanation(false)}
                    className="mt-4 px-4 py-2 border border-gray-600 rounded hover:border-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ready Status */}
        <div className="text-center mt-8">
          <p className="text-gray-400">
            <span className="text-green-400">{">"}</span> READY TO EXECUTE _
          </p>
        </div>
      </div>

      {/* Review Options Modal */}
      {showReviewOptions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div
            ref={reviewModalRef}
            className="bg-gray-900 border-2 border-white rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {isReviewMode ? "Review Complete!" : "Quiz Complete!"}
            </h2>

            {poorPerformanceQuestions.length > 0 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    You have {poorPerformanceQuestions.length} question
                    {poorPerformanceQuestions.length > 1 ? "s" : ""} that need
                    more practice (2 stars or below).
                  </p>
                  {completionTime > 0 && (
                    <div className="bg-blue-900/30 border border-blue-600 rounded p-4 mb-4">
                      <p className="text-blue-300 text-sm">
                        ⏱️ Time Spent: {formatTime(completionTime)}
                      </p>
                    </div>
                  )}
                  <div className="bg-yellow-900/30 border border-yellow-600 rounded p-4 mb-6">
                    <p className="text-yellow-300 text-sm">
                      💡 Keep practicing these questions until you master them!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <button
                    onClick={startReviewMode}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold transition-colors"
                  >
                    Review Weak Questions ({poorPerformanceQuestions.length})
                  </button>

                  <button
                    onClick={exitReview}
                    className="w-full px-6 py-3 border border-gray-600 hover:border-white text-white rounded transition-colors"
                  >
                    Quit Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-green-300 text-lg mb-4">
                    Excellent work! You&apos;ve mastered all the questions.
                  </p>
                  <p className="text-gray-300 text-sm mb-4">
                    All questions scored 3 stars. Great job!
                  </p>
                  {completionTime > 0 && (
                    <div className="bg-green-900/30 border border-green-600 rounded p-4 mb-4">
                      <p className="text-green-300 text-sm font-medium">
                        Time Spent: {formatTime(completionTime)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={exitReview}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
                >
                  Complete Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
