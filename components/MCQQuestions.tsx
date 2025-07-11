import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Home, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  answer: "A" | "B" | "C" | "D";
  explanation?: string;
}

interface MCQQuestionsProps {
  title: string;
  questions: Question[];
  clearPDF: () => void;
}

const MCQQuestions: React.FC<MCQQuestionsProps> = ({ title, questions, clearPDF }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [validQuestions, setValidQuestions] = useState<Question[]>([]);
  const [aiExplanations, setAiExplanations] = useState<{ [key: number]: string }>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showAiExplanation, setShowAiExplanation] = useState<{ [key: number]: boolean }>({});

  // Refs for animations
  const cardRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const aiExplanationRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Simple animation functions to replace GSAP
  const fadeInUp = (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  };

  const fadeIn = (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(5px)';
    element.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  };

  const scaleIn = (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay);
  };

  // Smooth slide-in animation for AI explanations
  const slideInDown = (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return;
    
    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    element.style.maxHeight = '0';
    element.style.overflow = 'hidden';
    element.style.paddingTop = '0';
    element.style.paddingBottom = '0';
    element.style.marginTop = '0';
    element.style.marginBottom = '0';
    element.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
    
    // Force reflow
    element.offsetHeight;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.style.maxHeight = '2000px';
      element.style.paddingTop = '1.5rem';
      element.style.paddingBottom = '1.5rem';
      element.style.marginTop = '1rem';
      element.style.marginBottom = '0';
    }, delay);
  };

  // Function to get AI explanation
  const getAiExplanation = async (questionIndex: number) => {
    if (aiExplanations[questionIndex]) {
      setShowAiExplanation(prev => ({
        ...prev,
        [questionIndex]: true
      }));
      return;
    }

    setLoadingExplanation(true);
    try {
      const question = validQuestions[questionIndex];
      const correctAnswerIndex = question.answer.charCodeAt(0) - 65;
      const correctAnswerText = question.options[correctAnswerIndex];

      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.question,
          correctAnswer: `${question.answer}. ${correctAnswerText}`,
          options: question.options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      setAiExplanations(prev => ({
        ...prev,
        [questionIndex]: data.explanation
      }));
      
      // Show AI explanation with smooth animation
      setTimeout(() => {
        setShowAiExplanation(prev => ({
          ...prev,
          [questionIndex]: true
        }));
      }, 100);
    } catch (error) {
      console.error('Error getting explanation:', error);
      setAiExplanations(prev => ({
        ...prev,
        [questionIndex]: 'Sorry, unable to generate explanation at this time.'
      }));
      setShowAiExplanation(prev => ({
        ...prev,
        [questionIndex]: true
      }));
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Validate and filter questions on component mount
  useEffect(() => {
    console.log('MCQQuestions received questions:', questions);
    console.log('Questions length:', questions?.length);
    
    if (!questions || !Array.isArray(questions)) {
      console.error('Invalid questions data received:', questions);
      setValidQuestions([]);
      return;
    }

    const filtered = questions.filter((q): q is Question => {
      const isValid = q && 
        typeof q === 'object' &&
        typeof q.question === 'string' &&
        q.question.trim() !== '' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every(option => typeof option === 'string' && option.trim() !== '') &&
        (q.answer === "A" || q.answer === "B" || q.answer === "C" || q.answer === "D");
      
      if (!isValid) {
        console.warn('Invalid question filtered out:', q);
      }
      return isValid;
    });

    console.log('Filtered valid questions:', filtered.length);
    setValidQuestions(filtered);
  }, [questions]);

  // Animate on mount
  useEffect(() => {
    if (cardRef.current) {
      fadeInUp(cardRef.current, 50);
    }
  }, []);

  // Animate when question changes
  useEffect(() => {
    if (optionsRef.current && validQuestions.length > 0) {
      fadeInUp(optionsRef.current, 100);
    }
  }, [currentQuestionIndex, validQuestions]);

  // Animate explanation
  useEffect(() => {
    if (showExplanation[currentQuestionIndex] && explanationRef.current) {
      fadeIn(explanationRef.current, 100);
    }
  }, [showExplanation, currentQuestionIndex]);

  // Animate AI explanation
  useEffect(() => {
    if (showAiExplanation[currentQuestionIndex] && aiExplanationRef.current) {
      slideInDown(aiExplanationRef.current, 100);
    }
  }, [showAiExplanation, currentQuestionIndex]);

  // Animate results
  useEffect(() => {
    if (isQuizComplete && resultsRef.current) {
      scaleIn(resultsRef.current, 100);
    }
  }, [isQuizComplete]);

  // Early return if no valid questions
  if (!validQuestions || validQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <Card ref={cardRef} className="border-2 border-pink-500/30 bg-black">
            <CardHeader className="text-center pb-3 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-pink-400">
                No Valid Questions Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 text-center p-4 sm:p-6">
              <div className="text-base sm:text-lg text-gray-300">
                {questions?.length > 0 
                  ? "The generated questions appear to be invalid. Please try generating again."
                  : "No questions were generated. Please try again."
                }
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Debug info: Received {questions?.length || 0} questions, {validQuestions.length} valid
              </div>
              <Button
                onClick={clearPDF}
                className="bg-pink-600 hover:bg-pink-700 text-white transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = validQuestions[currentQuestionIndex];
  const hasAnswered = userAnswers[currentQuestionIndex] !== undefined;
  const correctAnswerIndex = currentQuestion.answer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
  const isCorrect = userAnswers[currentQuestionIndex] === correctAnswerIndex;

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
    
    // Show explanation after answering with delay for animation
    setTimeout(() => {
      setShowExplanation(prev => ({
        ...prev,
        [currentQuestionIndex]: true
      }));
    }, 300);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < validQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsQuizComplete(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowExplanation({});
    setCurrentQuestionIndex(0);
    setIsQuizComplete(false);
    setAiExplanations({});
    setShowAiExplanation({});
  };

  const getScore = () => {
    const correctAnswers = Object.keys(userAnswers).filter(
      key => {
        const questionIndex = parseInt(key);
        if (questionIndex >= validQuestions.length) return false;
        const correctAnswerIndex = validQuestions[questionIndex].answer.charCodeAt(0) - 65;
        return userAnswers[questionIndex] === correctAnswerIndex;
      }
    ).length;
    return { correct: correctAnswers, total: Object.keys(userAnswers).length };
  };

  const getScorePercentage = () => {
    const { correct, total } = getScore();
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  // Format AI explanation into structured sections with markdown support
  const formatAiExplanation = (explanation: string) => {
    if (!explanation) return null;
    
    // Helper function to process markdown formatting
    const processMarkdown = (text: string) => {
      // Convert **bold** to <strong>
      let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-100">$1</strong>');
      // Convert *italic* to <em>
      processed = processed.replace(/\*(.*?)\*/g, '<em class="italic text-purple-100">$1</em>');
      // Convert `code` to <code>
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-purple-800/50 px-2 py-1 rounded text-purple-100 font-mono text-sm">$1</code>');
      
      return processed;
    };
    
    // Split explanation into logical sections, preserving line breaks
    const sections = explanation.split('\n\n').filter(section => section.trim());
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          
          // Check if section contains bullet points (starts with * or -)
          if (trimmedSection.includes('\n*') || trimmedSection.includes('\n-') || trimmedSection.match(/^\*/)) {
            const lines = trimmedSection.split('\n').filter(line => line.trim());
            return (
              <div key={index} className="space-y-3">
                {lines.map((line, lineIndex) => {
                  const trimmedLine = line.trim();
                  if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
                    const bulletContent = trimmedLine.replace(/^[*-]\s*/, '');
                    return (
                      <div key={lineIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div 
                          className="text-purple-200 leading-relaxed flex-1"
                          dangerouslySetInnerHTML={{ __html: processMarkdown(bulletContent) }}
                        />
                      </div>
                    );
                  } else if (trimmedLine) {
                    // Non-bullet line in bullet section
                    return (
                      <div 
                        key={lineIndex} 
                        className="text-purple-200 leading-relaxed font-semibold"
                        dangerouslySetInnerHTML={{ __html: processMarkdown(trimmedLine) }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
          
          // Check if it's a header-like section (contains colons and is relatively short)
          if (trimmedSection.includes(':') && trimmedSection.length < 150 && !trimmedSection.includes('\n')) {
            const [header, ...content] = trimmedSection.split(':');
            return (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-semibold text-purple-300 mb-1">
                  <span dangerouslySetInnerHTML={{ __html: processMarkdown(header.trim()) }} />:
                </h5>
                {content.length > 0 && (
                  <div 
                    className="text-purple-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(content.join(':').trim()) }}
                  />
                )}
              </div>
            );
          }
          
          // Handle multi-line content with potential formatting
          if (trimmedSection.includes('\n')) {
            const lines = trimmedSection.split('\n').filter(line => line.trim());
            return (
              <div key={index} className="space-y-2">
                {lines.map((line, lineIndex) => (
                  <div 
                    key={lineIndex} 
                    className="text-purple-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(line.trim()) }}
                  />
                ))}
              </div>
            );
          }
          
          // Regular single paragraph
          return (
            <div 
              key={index} 
              className="text-purple-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processMarkdown(trimmedSection) }}
            />
          );
        })}
      </div>
    );
  };

  if (isQuizComplete) {
    const { correct, total } = getScore();
    const percentage = getScorePercentage();
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <Card ref={resultsRef} className="border-2 border-pink-500/30 bg-black">
            <CardHeader className="text-center pb-3 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-pink-400">
                MCQ Quiz Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="text-center">
                <div className="text-4xl sm:text-6xl font-bold text-pink-400 mb-2 animate-pulse">
                  {percentage}%
                </div>
                <div className="text-base sm:text-lg text-gray-300">
                  {correct} out of {total} questions correct
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2">
                  Total questions available: {validQuestions.length}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={resetQuiz}
                  className="bg-pink-600 hover:bg-pink-700 text-white transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={clearPDF}
                  variant="outline"
                  className="border-pink-400 text-pink-400 hover:bg-pink-900/20 transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl mx-auto w-full">
        <Card ref={cardRef} className="border-2 border-pink-500/30 bg-black">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-pink-400 leading-tight">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 sm:gap-4">
                <Badge variant="secondary" className="bg-pink-900/50 text-pink-300 border-pink-500/30 text-xs sm:text-sm">
                  {currentQuestionIndex + 1} / {validQuestions.length}
                </Badge>
                <div className="text-xs sm:text-sm text-gray-500">
                  MCQ Questions
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="bg-black rounded-lg p-4 sm:p-6 border border-pink-500/20">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-100 leading-snug">
                Question {currentQuestionIndex + 1}: {currentQuestion.question}
              </h3>
              
              <div ref={optionsRef} className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = userAnswers[currentQuestionIndex] === index;
                  const correctAnswerIndex = currentQuestion.answer.charCodeAt(0) - 65;
                  const isCorrectAnswer = index === correctAnswerIndex;
                  
                  let buttonClass = "w-full p-3 sm:p-4 text-left border-2 rounded-lg transition-all duration-200 ";
                  
                  if (!hasAnswered) {
                    buttonClass += "border-gray-600 bg-black text-gray-200 cursor-pointer";
                  } else if (isSelected && isCorrectAnswer) {
                    buttonClass += "border-green-500 bg-green-900/30 text-green-300";
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonClass += "border-red-500 bg-red-900/30 text-red-300";
                  } else if (isCorrectAnswer) {
                    buttonClass += "border-green-500 bg-green-900/30 text-green-300";
                  } else {
                    buttonClass += "border-gray-600 bg-black text-gray-400 opacity-60";
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered}
                      className={buttonClass}
                      data-option-index={index}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-left text-sm sm:text-base">
                          <span className="font-medium text-pink-400 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </span>
                        {hasAnswered && (
                          <div className="ml-2 flex-shrink-0">
                            {isCorrectAnswer ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {showExplanation[currentQuestionIndex] && currentQuestion.explanation && (
                <div ref={explanationRef} className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-blue-300 mb-2 text-sm sm:text-base">
                    Explanation:
                  </h4>
                  <p className="text-blue-200 leading-relaxed text-sm sm:text-base">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {showAiExplanation[currentQuestionIndex] && aiExplanations[currentQuestionIndex] && (
                <div 
                  ref={aiExplanationRef} 
                  className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-lg border border-purple-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                      <span className="text-white font-bold text-xs sm:text-sm">AI</span>
                    </div>
                    <h4 className="font-semibold text-purple-300 text-sm sm:text-lg">
                      AI-Generated Explanation
                    </h4>
                  </div>
                  <div className="pl-8 sm:pl-11 text-sm sm:text-base">
                    {formatAiExplanation(aiExplanations[currentQuestionIndex])}
                  </div>
                </div>
              )}
              
              {hasAnswered && (
                <div className="mt-3 sm:mt-4 p-3 bg-black rounded-lg border border-gray-600/30">
                  <div className="text-xs sm:text-sm text-gray-300">
                    <strong>Correct Answer:</strong> {currentQuestion.answer} - {currentQuestion.options[correctAnswerIndex]}
                  </div>
                  {isCorrect ? (
                    <div className="text-green-400 font-medium mt-1 text-xs sm:text-sm">
                      ✓ Correct!
                    </div>
                  ) : (
                    <div className="text-red-400 font-medium mt-1 text-xs sm:text-sm">
                      ✗ Incorrect. Your answer: {String.fromCharCode(65 + userAnswers[currentQuestionIndex])}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <Button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-pink-400 text-pink-400 hover:bg-pink-900/20 disabled:opacity-50 transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                {hasAnswered && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={() => getAiExplanation(currentQuestionIndex)}
                      disabled={loadingExplanation}
                      className='border-pink-500 border-2 bg-black text-pink-500 hover:bg-black w-full sm:w-auto text-sm sm:text-base'
                    >
                      {loadingExplanation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Getting Explanation...</span>
                          <span className="sm:hidden">Loading...</span>
                        </>
                      ) : (
                        'Explain'
                      )}
                    </Button>
                    <Button
                      onClick={nextQuestion}
                      className="bg-pink-600 hover:bg-pink-700 text-white transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">
                        {currentQuestionIndex === validQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                      </span>
                      <span className="sm:hidden">
                        {currentQuestionIndex === validQuestions.length - 1 ? 'Finish' : 'Next'}
                      </span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={clearPDF}
                variant="ghost"
                className="text-pink-400 hover:bg-pink-900/20 transition-all duration-300 text-sm sm:text-base"
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

export default MCQQuestions;