"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader,Loader2, X } from "lucide-react";
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
import { flashcardSchema,  questionSchema } from "@/lib/types";

type QuestionType = 'quiz' | 'flashcards' | 'mcq' | 'theory';

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
  const [questionType, setQuestionType] = useState<QuestionType>('quiz');
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(30);

  const handleLoadText = (text: string, name: string) => {
    setExtractedText(text);
    setTitle(name);
    toast.success(`Loaded "${name}"`);
  };
  
  const handleGenerateQuizFromSaved = (text: string, name: string) => {
    setExtractedText(text);
    setTitle(name);
    setIsGenerating(true);
    try {
      submit({ extractedText: text, numberOfQuestions });
    } catch (error) {
      console.log("Error generating quiz from saved text:", error);
      setIsGenerating(false);
      toast.error("Failed to generate quiz. Please try again.");
    }
  };
  
  const handleGenerateFlashCardsFromSaved = (text: string, name: string) => {
    setExtractedText(text);
    setTitle(name);
    setIsGenerating(true);
    try {
      submitFlashCards({ extractedText: text, numberOfQuestions });
    } catch (error) {
      console.log("Error generating flashcards from saved text:", error);
      setIsGenerating(false);
      toast.error("Failed to generate flashcards. Please try again.");
    }
  };
  
  const handleGenerateMCQFromSaved = (text: string, name: string) => {
    setExtractedText(text);
    setTitle(name);
    setIsGenerating(true);
    try {
      submitMCQ({ extractedText: text, numberOfQuestions });
    } catch (error) {
      console.log("Error generating MCQ from saved text:", error);
      setIsGenerating(false);
      toast.error("Failed to generate MCQ. Please try again.");
    }
  };

  // Helper function to safely convert partial objects to complete Question objects
  const safeConvertToQuestions = (partialArray: any): Question[] => {
    if (!Array.isArray(partialArray)) return [];
    
    return partialArray
      .filter((item): item is Question => 
        item && 
        typeof item === 'object' &&
        typeof item.question === 'string' &&
        Array.isArray(item.options) &&
        (item.answer === "A" || item.answer === "B" || item.answer === "C" || item.answer === "D")
      )
      .map(item => ({
        question: item.question,
        options: item.options,
        answer: item.answer as "A" | "B" | "C" | "D",
        explanation: item.explanation || undefined
      }));
  };

  // Helper function to safely convert partial objects to complete Flashcard objects
  const safeConvertToFlashcards = (partialArray: any): Flashcard[] => {
    if (!Array.isArray(partialArray)) return [];
    
    return partialArray
      .filter((item): item is Flashcard => 
        item && 
        typeof item === 'object' &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string'
      )
      .map(item => ({
        question: item.question,
        answer: item.answer,
        explanation: item.explanation || undefined,
        options: item.options || undefined
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
      
      setQuestionType('quiz');
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
      console.log("Flashcards generated - Valid flashcards length:", validFlashcards.length);
      
      setFlashcards(validFlashcards);
      setQuestionType('flashcards');
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
      console.log("MCQ generated - Valid questions length:", validQuestions.length);
      
      setQuestions(validQuestions);
      setQuestionType('mcq');
      setIsGenerating(false);
    },
  });
  
  const {
    submit: submitTheory,
    object: partialTheory,
    isLoading: isLoadingTheory,
  } = experimental_useObject({
    api: "/api/generate-theory",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      console.log("Theory generation error:", error);
      toast.error("Failed to generate theory questions. Please try again.");
      setIsGenerating(false);
    },
    onFinish: ({ object }) => {
      console.log("Theory generated - Raw object:", object);
      setQuestions(object ?? []);
      setQuestionType('theory');
      setIsGenerating(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker.",
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => (file.type === "application/pdf" || 
                 file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
                 file.type === "application/vnd.ms-powerpoint") && 
                file.size <= 30 * 1024 * 1024,
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF and PPT files under 30MB are allowed.");
    }

    // Add new files to existing files instead of replacing
    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);

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
        })),
      );

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      toast.error("Please upload files and wait for text extraction to complete.");
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

  const handleFlashCards = async () => {
    if (!extractedText) {
      toast.error("Please upload files and wait for text extraction to complete.");
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
      toast.error("Please upload files and wait for text extraction to complete.");
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
      toast.error("Please upload files and wait for text extraction to complete.");
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
    setExtractedText("");
    setQuestions([]);
    setFlashcards([]);
    setQuestionType('quiz');
    setTitle(undefined);
    setIsGenerating(false);
    setIsExtracting(false);
    setNumberOfQuestions(30);
    
    // Reset any partial states to prevent controller issues
    // Note: The experimental_useObject hooks will handle their own cleanup
  };

  // Calculate progress for different question types
  const calculateProgress = (partialData: any, isFlashcardType: boolean = false): number => {
    if (!partialData) return 0;
    const validItems = isFlashcardType ? safeConvertToFlashcards(partialData) : safeConvertToQuestions(partialData);
    return Math.min((validItems.length / numberOfQuestions) * 100, 100);
  };

  const progress = calculateProgress(partialQuestions);
  const flashCardProgress = calculateProgress(partialFlashCards, true);
  const mcqProgress = calculateProgress(partialMCQ);
  const theoryProgress = calculateProgress(partialTheory);

  const currentProgress = isLoading ? progress : 
                         isLoadingFlashCards ? flashCardProgress :
                         isLoadingMCQ ? mcqProgress :
                         isLoadingTheory ? theoryProgress : 0;

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
  const anyLoading = isLoading || isLoadingFlashCards || isLoadingMCQ || isLoadingTheory;

  // Enhanced debug logging
  console.log("=== COMPONENT STATE DEBUG ===");
  console.log("Questions length:", questions.length);
  console.log("Flashcards length:", flashcards.length);
  console.log("Question type:", questionType);
  console.log("Any loading:", anyLoading);
  console.log("Is generating:", isGenerating);
  console.log("Is extracting:", isExtracting);
  console.log("Extracted text length:", extractedText.length);
  console.log("Current partial questions length:", currentPartialQuestions.length);
  console.log("Should render component?", (questions.length > 0 || flashcards.length > 0) && !anyLoading);
  console.log("===============================");

  // Render the appropriate component when questions are ready
  if ((questions.length > 0 || flashcards.length > 0) && !anyLoading) {
    console.log("🎯 Rendering component for type:", questionType);
    console.log("🎯 Questions to render:", questions.length);
    console.log("🎯 Flashcards to render:", flashcards.length);
    
    try {
      switch (questionType) {
        case 'flashcards':
          console.log("🎯 Rendering FlashCards component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <FlashCards title={title ?? "Flashcards"} questions={flashcards} clearPDF={clearPDF} />
            </motion.div>
          );
        case 'mcq':
          console.log("🎯 Rendering MCQQuestions component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <MCQQuestions title={title ?? "MCQ Questions"} questions={questions} clearPDF={clearPDF} />
            </motion.div>
          );
        case 'theory':
          console.log("🎯 Rendering TheoryQuestions component");
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <TheoryQuestions title={title ?? "Theory Questions"} questions={questions} clearPDF={clearPDF} />
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
              <Quiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />
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
            <h2 className="text-xl font-bold text-red-600 mb-4">Rendering Error</h2>
            <p className="text-gray-600 mb-4">There was an error rendering the component.</p>
            <Button onClick={clearPDF} className="bg-pink-500 hover:bg-pink-600 text-white">
              Go Back
            </Button>
          </div>
        </motion.div>
      );
    }
  }

  return (
    <motion.div
      className="min-h-[100dvh] w-full flex justify-center"
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
      
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md h-full border-3 sm:border sm:h-fit mt-12 border-pink-500 dark:border-pink-600/70">
          <CardHeader className="text-center space-y-6">
            <motion.div 
              className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="rounded-full bg-pink-100 dark:bg-pink-900/50 p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <FileUp className="h-6 w-6 text-pink-500 dark:text-pink-400" />
              </motion.div>
              <Plus className="h-4 w-4" />
              <motion.div 
                className="rounded-full bg-primary/10 p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-6 w-6" />
              </motion.div>
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <CardTitle className="text-2xl font-bold py-5 ">
                <span className="text-pink-500">Maampee&apos;s </span> <span className="text-2xl px-2"> Ai </span>
              </CardTitle>
              <CardDescription className="text-base">
                This is to help with your studies.
                Please upload your PDF or PPT to get multiple choice questions.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.form 
              onSubmit={handleSubmitWithFiles} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                className="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-pink-300"
              
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
                >
                  <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
                </motion.div>
                <p className="text-sm text-muted-foreground text-center">
                  {files.length > 0 ? (
                    <motion.span 
                      className="font-medium text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                      {isExtracting && <div className="flex text-pink-500">
                         <h1>Extracting</h1>
                         <span className=""><Loader className="h-4 w-4 mx-1 animate-spin" /></span>
                        </div>}
                      {extractedText && !isExtracting && <span className="text-green-500"> ✓</span>}
                    </motion.span>
                  ) : (
                    <span>Drop your PDF or PPT files here or click to browse.</span>
                  )}
                </p>
              </motion.div>
              
              {/* Display selected files */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div 
                    className="space-y-2 max-h-32 overflow-y-auto"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <span className="text-sm truncate flex-1 mr-2">
                          {file.name}
                        </span>
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10"
                            disabled={anyLoading || isExtracting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <ExtractedTextStorage
              extractedText={extractedText}
              fileName={files.length > 0 ? files[0].name : ""}
              onLoadText={handleLoadText}
              onGenerateQuiz={handleGenerateQuizFromSaved}
              onGenerateFlashCards={handleGenerateFlashCardsFromSaved}
              onGenerateMCQ={handleGenerateMCQFromSaved}
              disabled={anyLoading || isExtracting}
              isLoadingQuiz={isLoading}
              isLoadingFlashCards={isLoadingFlashCards}
              isLoadingMCQ={isLoadingMCQ}
            />

              {/* Number of Questions Input */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <div className="my-10">

                <Label htmlFor="numberOfQuestions" className="text-sm font-medium m-1">
                  Number of Questions
                </Label>
                <Input
                  id="numberOfQuestions"
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Math.max(1, Math.min(100, parseInt(e.target.value) || 30)))}
                  className="w-full mt-2"
                  disabled={anyLoading || isExtracting}
                  placeholder="30"
                />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  disabled={!extractedText || anyLoading || isExtracting}
                >
                  {isLoading ? (
                    <motion.span 
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Quiz...</span>
                    </motion.span>
                  ) : (
                    `Generate Quiz`
                  )}
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <NewButtons 
                  onFlashCards={handleFlashCards}
                  onMCQ={handleMCQ}
                  onTheory={handleTheory}
                  disabled={!extractedText || anyLoading || isExtracting}
                  isLoadingFlashCards={isLoadingFlashCards}
                  isLoadingMCQ={isLoadingMCQ}
                  isLoadingTheory={isLoadingTheory}
                />
                {/* Progress Bar - Only show when generating questions */}
              <AnimatePresence>
                {anyLoading && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between text-sm text-muted-foreground my-4 mx-2">
                      <span>Generating questions...</span>
                      <span>{Math.round(currentProgress)}%</span>
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                  </motion.div>
                )}
              </AnimatePresence>
              </motion.div>
            </motion.form>
          </CardContent>
          <AnimatePresence>
            
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
}