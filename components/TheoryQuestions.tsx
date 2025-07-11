import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Home, ChevronLeft, ChevronRight, BookOpen, Lightbulb } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  answer: "A" | "B" | "C" | "D";
  explanation?: string;
}

interface TheoryQuestionsProps {
  title: string;
  questions: Question[];
  clearPDF: () => void;
}

const TheoryQuestions: React.FC<TheoryQuestionsProps> = ({ title, questions, clearPDF }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // Process and limit questions to 45 maximum
  const processedQuestions = React.useMemo(() => {
    console.log('=== Processing Questions ===');
    console.log('Raw questions received:', questions);
    console.log('Questions length:', questions?.length);
    
    if (!questions || !Array.isArray(questions)) {
      console.log('❌ No valid questions array');
      return [];
    }

    // Filter and validate questions
    const validQuestions = questions
      .filter((q): q is Question => {
        const isValid = q && 
          typeof q === 'object' &&
          typeof q.question === 'string' &&
          q.question.trim().length > 0 &&
          Array.isArray(q.options) &&
          q.options.length >= 4 &&
          q.options.every(opt => typeof opt === 'string' && opt.trim().length > 0) &&
          (q.answer === "A" || q.answer === "B" || q.answer === "C" || q.answer === "D");
        
        if (!isValid) {
          console.log('❌ Invalid question:', q);
        }
        return isValid;
      })
      .slice(0, 45); // Limit to 45 questions

    console.log('✅ Valid questions:', validQuestions.length);
    console.log('First valid question:', validQuestions[0]);
    
    return validQuestions;
  }, [questions]);

  // Debug logging
  useEffect(() => {
    console.log('=== TheoryQuestions Component Debug ===');
    console.log('Title:', title);
    console.log('Raw questions:', questions);
    console.log('Processed questions:', processedQuestions);
    console.log('Processed questions length:', processedQuestions?.length);
    console.log('Current question index:', currentQuestionIndex);
    console.log('======================================');
  }, [title, questions, processedQuestions, currentQuestionIndex]);

  // Safety check - if no questions, show error state
  if (!processedQuestions || processedQuestions.length === 0) {
    console.log('🚨 TheoryQuestions: No processed questions available');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                No Theory Questions Available
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  There was an issue loading the theory questions. The questions may not be in the expected format or may be empty.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p>Debug info:</p>
                  <p>Raw questions received: {questions?.length || 0}</p>
                  <p>Valid questions processed: {processedQuestions?.length || 0}</p>
                </div>
                <Button
                  onClick={clearPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Validate current question
  const currentQuestion = processedQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    console.log('🚨 Current question is undefined, index:', currentQuestionIndex);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                Question Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Current question could not be loaded. Please try again.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p>Debug info:</p>
                  <p>Current index: {currentQuestionIndex}</p>
                  <p>Total questions: {processedQuestions?.length || 0}</p>
                </div>
                <Button
                  onClick={clearPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasAnswered = userAnswers[currentQuestionIndex] !== undefined;
  const correctAnswerIndex = currentQuestion.answer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
  const isCorrect = userAnswers[currentQuestionIndex] === correctAnswerIndex;

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    
    console.log('Selected answer:', answerIndex, 'for question:', currentQuestionIndex);
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
    
    // Show explanation after answering
    setShowExplanation(prev => ({
      ...prev,
      [currentQuestionIndex]: true
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < processedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      console.log('Moving to next question:', currentQuestionIndex + 1);
    } else {
      setIsQuizComplete(true);
      console.log('Quiz completed');
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      console.log('Moving to previous question:', currentQuestionIndex - 1);
    }
  };

  const resetQuiz = () => {
    console.log('Resetting quiz');
    setUserAnswers({});
    setShowExplanation({});
    setCurrentQuestionIndex(0);
    setIsQuizComplete(false);
  };

  const getScore = () => {
    const correctAnswers = Object.keys(userAnswers).filter(
      key => {
        const questionIndex = parseInt(key);
        const correctAnswerIndex = processedQuestions[questionIndex].answer.charCodeAt(0) - 65;
        return userAnswers[questionIndex] === correctAnswerIndex;
      }
    ).length;
    return { correct: correctAnswers, total: Object.keys(userAnswers).length };
  };

  const getScorePercentage = () => {
    const { correct, total } = getScore();
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  if (isQuizComplete) {
    const { correct, total } = getScore();
    const percentage = getScorePercentage();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                Theory Quiz Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {percentage}%
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-300">
                  {correct} out of {total} questions correct
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Great work on exploring these theoretical concepts! Understanding theory builds the foundation for practical application.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={clearPDF}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Home className="mr-2 h-4 w-4" />
                  New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering question:', currentQuestionIndex + 1, 'of', processedQuestions.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {title}
                  </CardTitle>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Theoretical Concepts & Principles
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                {currentQuestionIndex + 1} / {processedQuestions.length}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {currentQuestionIndex + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>
              
              <div className="space-y-3 ml-11">
                {currentQuestion.options && currentQuestion.options.map((option, index) => {
                  const isSelected = userAnswers[currentQuestionIndex] === index;
                  const correctAnswerIndex = currentQuestion.answer.charCodeAt(0) - 65;
                  const isCorrectAnswer = index === correctAnswerIndex;
                  
                  let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";
                  
                  if (!hasAnswered) {
                    buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20";
                  } else if (isSelected && isCorrectAnswer) {
                    buttonClass += "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonClass += "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
                  } else if (isCorrectAnswer) {
                    buttonClass += "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
                  } else {
                    buttonClass += "border-gray-200 dark:border-gray-700 opacity-60";
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered}
                      className={buttonClass}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="flex-1 text-sm leading-relaxed">{option}</span>
                        </div>
                        {hasAnswered && (
                          <div className="ml-2 flex-shrink-0">
                            {isCorrectAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isSelected ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {showExplanation[currentQuestionIndex] && currentQuestion.explanation && (
                <div className="mt-6 ml-11">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                          Theoretical Explanation:
                        </h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {hasAnswered && (
                  <Button
                    onClick={nextQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentQuestionIndex === processedQuestions.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={clearPDF}
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TheoryQuestions;