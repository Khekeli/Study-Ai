"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ExtractedTextStorage from "@/components/ExtractedTextStorage";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Quiz from "@/components/quiz";
import FlashCards from "@/components/FlashCards";
import MCQQuestions from "@/components/MCQQuestions";
import TheoryQuestions from "@/components/TheoryQuestions";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import NewButtons from "@/components/NewButtons";
import { flashcardSchema, questionSchema } from "@/lib/types";

type QuestionType = "quiz" | "flashcards" | "mcq" | "theory";

// Define the complete Question type to match what components expect
interface Question {
  question: string;
  options: string[];
  answer: "A" | "B" | "C" | "D";
  explanation?: string;
}

// Define the Flashcard type
interface Flashcard {
  question: string;
  answer: string;
  explanation?: string;
  options?: string[];
}

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [theoryData, setTheoryData] = useState<any>(null);
  const [questionType, setQuestionType] = useState<QuestionType>("quiz");
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(30);
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
  const [activeStudyTab, setActiveStudyTab] = useState<"obj" | "theory">("obj");

  const handleLoadText = (text: string, name: string) => {
    setExtractedText(text);
    setTitle(name);
    setHasUploadedFiles(false); // Add this line
    toast.success(
      `Loaded "${name}" - you can now generate questions using the buttons below`
    );
  };

  // Helper function to safely convert partial objects to complete Question objects
  const safeConvertToQuestions = (partialArray: any): Question[] => {
    if (!Array.isArray(partialArray)) return [];

    return partialArray
      .filter(
        (item): item is Question =>
          item &&
          typeof item === "object" &&
          typeof item.question === "string" &&
          Array.isArray(item.options) &&
          (item.answer === "A" ||
            item.answer === "B" ||
            item.answer === "C" ||
            item.answer === "D")
      )
      .map((item) => ({
        question: item.question,
        options: item.options,
        answer: item.answer as "A" | "B" | "C" | "D",
        explanation: item.explanation || undefined,
      }));
  };

  // Helper function to safely convert partial objects to complete Flashcard objects
  const safeConvertToFlashcards = (partialArray: any): Flashcard[] => {
    if (!Array.isArray(partialArray)) return [];

    return partialArray
      .filter(
        (item): item is Flashcard =>
          item &&
          typeof item === "object" &&
          typeof item.question === "string" &&
          typeof item.answer === "string"
      )
      .map((item) => ({
        question: item.question,
        answer: item.answer,
        explanation: item.explanation || undefined,
        options: item.options || undefined,
      }));
  };

  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: z.array(questionSchema), // Use dynamic array schema instead of fixed questionsSchema
    initialValue: undefined,
    onError: (error) => {
      console.log("Quiz generation error:", error);
      toast.error("Failed to generate quiz. Please try again.");
      setIsGenerating(false);
    },
    onFinish: ({ object }) => {
      console.log("Quiz generated - Raw object:", object);
      console.log("Quiz generated - Object type:", typeof object);
      console.log("Quiz generated - Is array:", Array.isArray(object));

      // The object should already be in the correct format since we're using z.array(questionSchema)
      if (Array.isArray(object)) {
        console.log("Quiz generated - Setting questions directly:", object);
        setQuestions(object);
      } else {
        // Fallback to safe conversion if needed
        const validQuestions = safeConvertToQuestions(object);
        console.log("Quiz generated - Valid questions:", validQuestions);
        setQuestions(validQuestions);
      }

      setQuestionType("quiz");
      setIsGenerating(false);
    },
  });

  const {
    submit: submitFlashCards,
    object: partialFlashCards,
    isLoading: isLoadingFlashCards,
  } = experimental_useObject({
    api: "/api/generate-flashcards",
    schema: z.array(flashcardSchema), // Use dynamic array schema instead of fixed flashcardsSchema
    initialValue: undefined,
    onError: (error) => {
      console.log("Flashcards generation error:", error);
      toast.error("Failed to generate flashcards. Please try again.");
      setIsGenerating(false);
    },
    onFinish: ({ object }) => {
      console.log("Flashcards generated - Raw object:", object);
      console.log("Flashcards generated - Object type:", typeof object);
      console.log("Flashcards generated - Is array:", Array.isArray(object));

      // Convert the object to proper Flashcard format
      const validFlashcards = safeConvertToFlashcards(object);
      console.log("Flashcards generated - Valid flashcards:", validFlashcards);
      console.log(
        "Flashcards generated - Valid flashcards length:",
        validFlashcards.length
      );

      setFlashcards(validFlashcards);
      setQuestionType("flashcards");
      setIsGenerating(false);
    },
  });

  const {
    submit: submitMCQ,
    object: partialMCQ,
    isLoading: isLoadingMCQ,
  } = experimental_useObject({
    api: "/api/generate-mcq",
    schema: z.array(questionSchema),
    initialValue: undefined,
    onError: (error) => {
      console.log("MCQ generation error:", error);
      toast.error("Failed to generate MCQ questions. Please try again.");
      setIsGenerating(false);
    },
    onFinish: ({ object }) => {
      console.log("MCQ generated - Raw object:", object);
      console.log("MCQ generated - Object type:", typeof object);
      console.log("MCQ generated - Is array:", Array.isArray(object));

      // Convert the object to proper Question format
      const validQuestions = safeConvertToQuestions(object);
      console.log("MCQ generated - Valid questions:", validQuestions);
      console.log(
        "MCQ generated - Valid questions length:",
        validQuestions.length
      );

      setQuestions(validQuestions);
      setQuestionType("mcq");
      setIsGenerating(false);
    },
  });

  const {
    submit: submitTheory,
    object: partialTheory,
    isLoading: isLoadingTheory,
  } = experimental_useObject({
    api: "/api/generate-theory",
    schema: z.object({
      questions: z.array(
        z.object({
          question: z.string(),
          answer: z.string(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          questionType: z
            .enum(["explain", "compare", "analyze", "apply", "evaluate"])
            .optional(),
        })
      ),
      key_definitions: z.record(z.string()).optional(),
      recommended_visuals: z.array(z.string()).optional(),
      study_tips: z.array(z.string()).optional(),
      common_misconceptions: z
        .array(
          z.object({
            misconception: z.string(),
            correction: z.string(),
          })
        )
        .optional(),
    }),
    initialValue: undefined,
    onError: (error) => {
      console.log("Theory generation error:", error);
      toast.error("Failed to generate theory questions. Please try again.");
      setIsGenerating(false);
    },
    onFinish: ({ object }) => {
      console.log("Theory generated - Raw object:", object);
      setTheoryData(object);
      setQuestionType("theory");
      setIsGenerating(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker."
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) =>
        (file.type === "application/pdf" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          file.type === "application/vnd.ms-powerpoint") &&
        file.size <= 30 * 1024 * 1024
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF and PPT files under 30MB are allowed.");
    }

    // Add new files to existing files instead of replacing
    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    setHasUploadedFiles(newFiles.length > 0);

    // Extract text immediately after files are added
    if (validFiles.length > 0) {
      await extractTextFromFiles(newFiles);
    }
  };

  const extractTextFromFiles = async (filesToExtract: File[]) => {
    setIsExtracting(true);

    try {
      const encodedFiles = await Promise.all(
        filesToExtract.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        }))
      );

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: encodedFiles }),
      });

      const result = await response.json();

      if (result.success) {
        setExtractedText(result.extractedText);
        toast.success("Text extracted successfully!");

        // Generate title from first file
        const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
        setTitle(generatedTitle);
      } else {
        toast.error("Failed to extract text from files.");
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      toast.error("Failed to extract text from files.");
    } finally {
      setIsExtracting(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setHasUploadedFiles(newFiles.length > 0);

    // If no files left, clear extracted text
    if (newFiles.length === 0) {
      setExtractedText("");
      setTitle(undefined);
    } else {
      // Re-extract text from remaining files
      extractTextFromFiles(newFiles);
    }
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!extractedText) {
      toast.error(
        "Please upload files and wait for text extraction to complete."
      );
      return;
    }

    // Prevent multiple simultaneous calls
    if (anyLoading) {
      return;
    }

    setIsGenerating(true);

    try {
      submit({ extractedText, numberOfQuestions });
    } catch (error) {
      console.log("Error in handleSubmitWithFiles:", error);
      setIsGenerating(false);
      toast.error("Failed to generate quiz. Please try again.");
    }
  };

  const handleQuizGeneration = async () => {
    if (!extractedText) {
      toast.error(
        "Please upload files and wait for text extraction to complete."
      );
      return;
    }

    // Prevent multiple simultaneous calls
    if (anyLoading) {
      return;
    }

    setIsGenerating(true);

    try {
      submit({ extractedText, numberOfQuestions });
    } catch (error) {
      console.log("Error in handleQuizGeneration:", error);
      setIsGenerating(false);
      toast.error("Failed to generate quiz. Please try again.");
    }
  };

  const handleFlashCards = async () => {
    if (!extractedText) {
      toast.error(
        "Please upload files and wait for text extraction to complete."
      );
      return;
    }

    // Prevent multiple simultaneous calls
    if (anyLoading) {
      return;
    }

    setIsGenerating(true);
    console.log("Starting flashcard generation...");

    try {
      submitFlashCards({ extractedText, numberOfQuestions });
    } catch (error) {
      console.log("Error in handleFlashCards:", error);
      setIsGenerating(false);
      toast.error("Failed to generate flashcards. Please try again.");
    }
  };

  const handleMCQ = async () => {
    if (!extractedText) {
      toast.error(
        "Please upload files and wait for text extraction to complete."
      );
      return;
    }

    // Prevent multiple simultaneous calls
    if (anyLoading) {
      return;
    }

    setIsGenerating(true);
    console.log("Starting MCQ generation...");

    try {
      submitMCQ({ extractedText, numberOfQuestions });
    } catch (error) {
      console.log("Error in handleMCQ:", error);
      setIsGenerating(false);
      toast.error("Failed to generate MCQ questions. Please try again.");
    }
  };

  const handleTheory = async () => {
    if (!extractedText) {
      toast.error(
        "Please upload files and wait for text extraction to complete."
      );
      return;
    }

    // Prevent multiple simultaneous calls
    if (anyLoading) {
      return;
    }

    setIsGenerating(true);
    console.log("Starting theory generation...");

    try {
      submitTheory({ extractedText, numberOfQuestions });
    } catch (error) {
      console.log("Error in handleTheory:", error);
      setIsGenerating(false);
      toast.error("Failed to generate theory questions. Please try again.");
    }
  };

  const clearPDF = () => {
    setFiles([]);
    setHasUploadedFiles(false);
    setExtractedText("");
    setQuestions([]);
    setFlashcards([]);
    setTheoryData(null);
    setQuestionType("quiz");
    setTitle(undefined);
    setIsGenerating(false);
    setIsExtracting(false);
    setNumberOfQuestions(30);

    // Reset any partial states to prevent controller issues
    // Note: The experimental_useObject hooks will handle their own cleanup
  };

  // Calculate progress for different question types
  const calculateProgress = (
    partialData: any,
    isFlashcardType: boolean = false
  ): number => {
    if (!partialData) return 0;
    const validItems = isFlashcardType
      ? safeConvertToFlashcards(partialData)
      : safeConvertToQuestions(partialData);
    return Math.min((validItems.length / numberOfQuestions) * 100, 100);
  };

  const progress = calculateProgress(partialQuestions);
  const flashCardProgress = calculateProgress(partialFlashCards, true);
  const mcqProgress = calculateProgress(partialMCQ);
  const theoryProgress = calculateProgress(partialTheory);

  const currentProgress = isLoading
    ? progress
    : isLoadingFlashCards
      ? flashCardProgress
      : isLoadingMCQ
        ? mcqProgress
        : isLoadingTheory
          ? theoryProgress
          : 0;

  // Get current partial questions safely
  const getCurrentPartialQuestions = () => {
    if (partialQuestions) return safeConvertToQuestions(partialQuestions);
    if (partialFlashCards) return safeConvertToFlashcards(partialFlashCards);
    if (partialMCQ) return safeConvertToQuestions(partialMCQ);
    if (partialTheory) return safeConvertToQuestions(partialTheory);
    return [];
  };

  const currentPartialQuestions = getCurrentPartialQuestions();
  // FIX: Only check for ANY loading state when determining if we should show components
  const anyLoading =
    isLoading || isLoadingFlashCards || isLoadingMCQ || isLoadingTheory;

  // Enhanced debug logging
  console.log("=== COMPONENT STATE DEBUG ===");
  console.log("Questions length:", questions.length);
  console.log("Flashcards length:", flashcards.length);
  console.log("Theory data:", theoryData);
  console.log("Theory questions count:", theoryData?.questions?.length || 0);
  console.log("Question type:", questionType);
  console.log("Any loading:", anyLoading);
  console.log("Is generating:", isGenerating);
  console.log("Is extracting:", isExtracting);
  console.log("Extracted text length:", extractedText.length);
  console.log(
    "Current partial questions length:",
    currentPartialQuestions.length
  );
  console.log(
    "Should render component?",
    (questions.length > 0 || flashcards.length > 0 || theoryData) && !anyLoading
  );
  console.log("===============================");

  // Render the appropriate component when questions are ready
  if (
    (questions.length > 0 || flashcards.length > 0 || theoryData) &&
    !anyLoading
  ) {
    console.log("🎯 Rendering component for type:", questionType);
    console.log("🎯 Questions to render:", questions.length);
    console.log("🎯 Flashcards to render:", flashcards.length);

    try {
      switch (questionType) {
        case "flashcards":
          console.log("🎯 Rendering FlashCards component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <FlashCards
                title={title ?? "Flashcards"}
                questions={flashcards}
                clearPDF={clearPDF}
              />
            </motion.div>
          );
        case "mcq":
          console.log("🎯 Rendering MCQQuestions component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <MCQQuestions
                title={title ?? "MCQ Questions"}
                questions={questions}
                clearPDF={clearPDF}
              />
            </motion.div>
          );
        case "theory":
          console.log("🎯 Rendering TheoryQuestions component");
          console.log("🎯 Theory data to render:", theoryData);
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <TheoryQuestions
                title={title ?? "Theory Questions"}
                theoryData={theoryData}
                clearPDF={clearPDF}
              />
            </motion.div>
          );
        default:
          console.log("🎯 Rendering Quiz component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Quiz
                title={title ?? "Quiz"}
                questions={questions}
                clearPDF={clearPDF}
              />
            </motion.div>
          );
      }
    } catch (error) {
      console.log("🚨 Error rendering component:", error);
      return (
        <motion.div
          className="min-h-screen flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Rendering Error
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error rendering the component.
            </p>
            <Button
              onClick={clearPDF}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Go Back
            </Button>
          </div>
        </motion.div>
      );
    }
  }

  return (
    <motion.div
      className="min-h-[100dvh] w-full bg-gradient-to-br from-pink-50/30 to-purple-50/30 dark:from-zinc-950 dark:to-zinc-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              Drag and drop files here
            </motion.div>
            <motion.div
              className="text-sm dark:text-zinc-400 text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {"(PDFs and PPTs only)"}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
            MAAMPEE
          </h1>
          <p className="text-muted-foreground">
            Easy to use ai study Assistant
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-12rem)]">
          {/* Left Column - Upload & Study Modes */}
          <motion.div
            className="space-y-6"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* File Upload Section */}
            <Card className="border-2 border-pink-500/20 dark:border-pink-600/30 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-pink-600 dark:text-pink-400">
                  Section for file upload and question number selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.form
                  onSubmit={handleSubmitWithFiles}
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {/* File Upload Area */}
                  <motion.div
                    className="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 transition-all duration-300 hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-900/10"
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={anyLoading || isExtracting}
                    />
                    <motion.div
                      animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-center"
                    >
                      <FileUp className="h-12 w-12 mb-4 text-muted-foreground mx-auto" />
                      <p className="text-base font-medium text-foreground mb-2">
                        {files.length > 0 ? (
                          <motion.span
                            className="text-pink-600 dark:text-pink-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {files.length} file{files.length > 1 ? "s" : ""}{" "}
                            selected
                            {isExtracting && (
                              <div className="flex items-center justify-center mt-2 text-pink-500">
                                <div className="flex flex-col justify-center items-center">
                                  <div>
                                    <span className="flex">
                                      Reading Doc...{" "}
                                      <Loader className="h-4 w-4 ml-2 animate-spin" />
                                    </span>
                                  </div>
                                  <span className=" text-gray-500 text-sm">
                                    (Larger files take more time)
                                  </span>
                                </div>
                              </div>
                            )}
                            {extractedText && !isExtracting && (
                              <span className="text-green-500 block mt-1">
                                ✓ Ready to generate
                              </span>
                            )}
                          </motion.span>
                        ) : (
                          "Drop files here or click to browse"
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF and PowerPoint files (max 30MB each)
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Selected Files List */}
                  <AnimatePresence>
                    {files.length > 0 && (
                      <motion.div
                        className="space-y-3 max-h-40 overflow-y-auto"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {files.map((file, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <span className="text-sm font-medium truncate flex-1 mr-3">
                              {file.name}
                            </span>
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                disabled={anyLoading || isExtracting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Number of Questions */}
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="numberOfQuestions"
                        className="text-sm font-medium"
                      >
                        Number of Questions
                      </Label>
                      <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                        {numberOfQuestions}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <style jsx>{`
                        .slider {
                          -webkit-appearance: none;
                          appearance: none;
                          height: 8px;
                          border-radius: 5px;
                          outline: none;
                          opacity: 0.7;
                          transition: opacity 0.2s;
                        }
                        .slider:hover {
                          opacity: 1;
                        }
                        .slider::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ec4899;
                          cursor: pointer;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                          transition: all 0.2s ease;
                        }
                        .slider::-webkit-slider-thumb:hover {
                          transform: scale(1.1);
                          box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
                        }
                        .slider::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #ec4899;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        }
                      `}</style>
                      <input
                        id="numberOfQuestions"
                        type="range"
                        min="1"
                        max="150"
                        value={numberOfQuestions}
                        onChange={(e) =>
                          setNumberOfQuestions(parseInt(e.target.value))
                        }
                        disabled={anyLoading || isExtracting}
                        className="w-full slider"
                        style={{
                          background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${
                            (numberOfQuestions / 150) * 100
                          }%, #e5e7eb ${(numberOfQuestions / 150) * 100}%, #e5e7eb 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>75</span>
                        <span>150</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.form>
              </CardContent>
            </Card>

            {/* Text Storage - Mobile: Show before Study Modes */}
            <div className="lg:hidden">
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    TEXT SELECTION
                  </CardTitle>
                  <CardDescription>
                    Save and manage your extracted content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExtractedTextStorage
                    extractedText={extractedText}
                    fileName={files.length > 0 ? files[0].name : ""}
                    onLoadText={handleLoadText}
                    disabled={anyLoading || isExtracting}
                    hasUploadedFiles={hasUploadedFiles}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Study Modes Section */}
            <Card className="border-2 border-pink-500/10 dark:border-pink-600/20 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-pink-600 dark:text-pink-400">
                  STUDY MODES
                </CardTitle>
                <CardDescription>
                  Choose how you want to study your materials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setActiveStudyTab("obj")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      activeStudyTab === "obj"
                        ? "bg-pink-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    Study OBJ
                  </button>
                  <button
                    onClick={() => setActiveStudyTab("theory")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      activeStudyTab === "theory"
                        ? "bg-white text-gray-900 border-l border-gray-300 dark:border-gray-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Study Theory
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-3">
                  {activeStudyTab === "obj" && (
                    <>
                      <Button
                        type="button"
                        onClick={handleMCQ}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        disabled={!extractedText || anyLoading || isExtracting}
                      >
                        {isLoadingMCQ ? (
                          <span className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating...</span>
                          </span>
                        ) : (
                          "MCQ"
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={handleQuizGeneration}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        disabled={!extractedText || anyLoading || isExtracting}
                      >
                        {isLoading ? (
                          <span className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating...</span>
                          </span>
                        ) : (
                          "Practice Quiz"
                        )}
                      </Button>
                    </>
                  )}

                  {activeStudyTab === "theory" && (
                    <>
                      <Button
                        type="button"
                        onClick={handleTheory}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        disabled={!extractedText || anyLoading || isExtracting}
                      >
                        {isLoadingTheory ? (
                          <span className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating...</span>
                          </span>
                        ) : (
                          "Theory (Active recall)"
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={handleFlashCards}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 h-14 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        disabled={!extractedText || anyLoading || isExtracting}
                      >
                        {isLoadingFlashCards ? (
                          <span className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating...</span>
                          </span>
                        ) : (
                          "Flash Cards"
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <AnimatePresence>
                  {anyLoading && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {isLoading
                            ? "Generating Quiz"
                            : isLoadingFlashCards
                              ? "Generating Flashcards"
                              : isLoadingMCQ
                                ? "Generating MCQ"
                                : isLoadingTheory
                                  ? "Generating Theory"
                                  : "Processing"}
                          ...
                        </span>
                        <span>{Math.round(currentProgress)}%</span>
                      </div>
                      <Progress value={currentProgress} className="h-2">
                        <div
                          className="h-full bg-pink-500 transition-all duration-300"
                          style={{ width: `${currentProgress}%` }}
                        />
                      </Progress>
                      {currentPartialQuestions.length > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Generated {currentPartialQuestions.length} of{" "}
                          {numberOfQuestions} questions
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Text Selection (Desktop Only) */}
          <motion.div
            className="space-y-6 hidden lg:block"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            {/* Text Storage */}
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  TEXT SELECTION
                </CardTitle>
                <CardDescription>
                  Save and manage your extracted content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExtractedTextStorage
                  extractedText={extractedText}
                  fileName={files.length > 0 ? files[0].name : ""}
                  onLoadText={handleLoadText}
                  disabled={anyLoading || isExtracting}
                  hasUploadedFiles={hasUploadedFiles}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
