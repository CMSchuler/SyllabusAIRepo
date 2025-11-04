"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Target, Clock, CheckCircle2, X, RotateCcw, Trophy, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

interface QuizModeProps {
  quizData?: Question[];
}

export function QuizMode({ quizData }: QuizModeProps = {}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const mockQuestions: Question[] = [
    {
      id: '1',
      question: 'Which of the following best describes stereoisomers?',
      options: [
        'Compounds with different molecular formulas',
        'Compounds with the same molecular formula but different connectivity',
        'Compounds with the same molecular formula and connectivity but different spatial arrangements',
        'Compounds with different functional groups'
      ],
      correctAnswer: 2,
      explanation: 'Stereoisomers have the same molecular formula and connectivity but differ in the spatial arrangement of atoms.',
      difficulty: 'medium',
      category: 'Stereochemistry'
    },
    {
      id: '2',
      question: 'What is the hybridization of the carbon atom in methane (CH₄)?',
      options: [
        'sp',
        'sp²',
        'sp³',
        'sp³d'
      ],
      correctAnswer: 2,
      explanation: 'In methane, carbon forms four sigma bonds with hydrogen atoms, requiring sp³ hybridization.',
      difficulty: 'easy',
      category: 'Molecular Structure'
    },
    {
      id: '3',
      question: 'According to Markovnikov\'s rule, in the addition of HBr to propene, where does the hydrogen attach?',
      options: [
        'To the carbon with fewer hydrogen atoms',
        'To the carbon with more hydrogen atoms',
        'Randomly to either carbon',
        'To the middle carbon only'
      ],
      correctAnswer: 1,
      explanation: 'Markovnikov\'s rule states that hydrogen attaches to the carbon that already has more hydrogen atoms.',
      difficulty: 'hard',
      category: 'Reaction Mechanisms'
    },
    {
      id: '4',
      question: 'Which functional group is characterized by the -OH group?',
      options: [
        'Aldehyde',
        'Ketone',
        'Alcohol',
        'Carboxylic acid'
      ],
      correctAnswer: 2,
      explanation: 'The hydroxyl group (-OH) is the characteristic functional group of alcohols.',
      difficulty: 'easy',
      category: 'Functional Groups'
    },
    {
      id: '5',
      question: 'What makes a molecule chiral?',
      options: [
        'It has a double bond',
        'It cannot be superimposed on its mirror image',
        'It has an odd number of carbons',
        'It contains oxygen'
      ],
      correctAnswer: 1,
      explanation: 'A chiral molecule cannot be superimposed on its mirror image, typically due to the presence of a stereocenter.',
      difficulty: 'medium',
      category: 'Stereochemistry'
    }
  ];

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
    toast.success('Quiz started! Good luck! 🍀');
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer before submitting');
      return;
    }

    const timeSpent = Date.now() - startTime;
    const selectedIndex = parseInt(selectedAnswer);
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;

    const result: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedIndex,
      isCorrect,
      timeSpent
    };

    setQuizResults(prev => [...prev, result]);
    setShowResult(true);

    if (isCorrect) {
      toast.success('Correct! 🎉');
    } else {
      toast.error('Not quite right. Check the explanation below.');
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
      setStartTime(Date.now());
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    const correctAnswers = quizResults.filter(result => result.isCorrect).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    if (percentage >= 80) {
      toast.success(`Outstanding! You scored ${percentage}%! 🏆`);
    } else if (percentage >= 60) {
      toast.success(`Good job! You scored ${percentage}%! 👏`);
    } else {
      toast.info(`You scored ${percentage}%. Keep studying and try again! 💪`);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizResults([]);
    setQuizStarted(false);
    setQuizCompleted(false);
    setStartTime(Date.now());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Ready for a Quiz?</CardTitle>
            <CardDescription>
              Test your knowledge with {totalQuestions} multiple choice questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                <div className="text-sm text-blue-700">Questions</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">~{totalQuestions * 2}</div>
                <div className="text-sm text-emerald-700">Minutes</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Quiz Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(mockQuestions.map(q => q.category))).map(category => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={startQuiz} size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Target className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    const correctAnswers = quizResults.filter(result => result.isCorrect).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const averageTime = Math.round(quizResults.reduce((sum, result) => sum + result.timeSpent, 0) / quizResults.length / 1000);

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>
              Here's how you performed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
                <div className="text-sm text-blue-700">Score</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{correctAnswers}/{totalQuestions}</div>
                <div className="text-sm text-emerald-700">Correct</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{averageTime}s</div>
                <div className="text-sm text-purple-700">Avg Time</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Question Review:</h3>
              {quizResults.map((result, index) => {
                const question = mockQuestions[index];
                return (
                  <div key={question.id} className="p-3 rounded-lg border bg-white/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Question {index + 1}</span>
                      {result.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{question.question}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <Button onClick={restartQuiz} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Quiz in Progress</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Badge>
            <Badge variant="outline">
              {currentQuestion.category}
            </Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-white/50 transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {!showResult && (
            <Button 
              onClick={submitAnswer} 
              className="w-full mt-6" 
              size="lg"
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          )}

          {showResult && (
            <div className="mt-6 space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                quizResults[quizResults.length - 1]?.isCorrect 
                  ? 'border-emerald-200 bg-emerald-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {quizResults[quizResults.length - 1]?.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    quizResults[quizResults.length - 1]?.isCorrect 
                      ? 'text-emerald-800' 
                      : 'text-red-800'
                  }`}>
                    {quizResults[quizResults.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              </div>

              <Button 
                onClick={nextQuestion} 
                className="w-full" 
                size="lg"
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}