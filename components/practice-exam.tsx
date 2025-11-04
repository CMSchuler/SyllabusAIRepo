"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  Trophy, 
  TrendingUp, 
  AlertCircle,
  Play,
  Pause,
  Flag,
  BookOpen,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

interface ExamResult {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeSpent: number;
  flagged: boolean;
}

interface PracticeExamProps {
  examData?: ExamQuestion[];
}

export function PracticeExam({ examData }: PracticeExamProps) {
  const [examMode, setExamMode] = useState<'setup' | 'taking' | 'review' | 'results'>('setup');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number | null }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(120 * 60); // 2 hours in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [examStartTime, setExamStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [examSettings, setExamSettings] = useState({
    duration: 120, // minutes
    questionCount: 50,
    difficulty: 'mixed',
    showTimer: true,
    allowReview: true
  });

  // Mock exam questions - in real implementation, these would come from API
  const mockExamQuestions: ExamQuestion[] = [
    {
      id: '1',
      question: 'Which of the following best describes the mechanism of nucleophilic substitution in primary alkyl halides?',
      options: [
        'SN1 mechanism with carbocation intermediate',
        'SN2 mechanism with backside attack',
        'E1 mechanism with elimination',
        'E2 mechanism with concerted elimination'
      ],
      correctAnswer: 1,
      explanation: 'Primary alkyl halides undergo SN2 mechanism due to the instability of primary carbocations. The nucleophile attacks from the backside, causing inversion of configuration.',
      difficulty: 'medium',
      category: 'Reaction Mechanisms',
      points: 2
    },
    {
      id: '2',
      question: 'What is the IUPAC name for the compound CH₃CH(OH)CH₂CH₃?',
      options: [
        '1-butanol',
        '2-butanol',
        '3-butanol',
        'butyl alcohol'
      ],
      correctAnswer: 1,
      explanation: '2-butanol is correct because the hydroxyl group is on the second carbon of the four-carbon chain.',
      difficulty: 'easy',
      category: 'Nomenclature',
      points: 1
    },
    {
      id: '3',
      question: 'In the addition of HBr to 2-methylpropene, which product is formed according to Markovnikov\'s rule?',
      options: [
        '1-bromo-2-methylpropane',
        '2-bromo-2-methylpropane',
        '1-bromo-1-methylpropane',
        '3-bromo-2-methylpropane'
      ],
      correctAnswer: 1,
      explanation: 'According to Markovnikov\'s rule, the hydrogen adds to the carbon with more hydrogens, and the bromine adds to the more substituted carbon, forming 2-bromo-2-methylpropane.',
      difficulty: 'hard',
      category: 'Addition Reactions',
      points: 3
    }
  ];

  const questions = examData || mockExamQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    setExamMode('taking');
    setExamStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setIsTimerRunning(true);
    toast.success('Exam started! Good luck! 🍀');
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
        toast.info('Question unflagged');
      } else {
        newSet.add(questionId);
        toast.info('Question flagged for review');
      }
      return newSet;
    });
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const submitExam = () => {
    setIsTimerRunning(false);
    
    const results: ExamResult[] = questions.map(question => {
      const selectedAnswer = selectedAnswers[question.id];
      const isCorrect = selectedAnswer === question.correctAnswer;
      
      return {
        questionId: question.id,
        selectedAnswer: selectedAnswer ?? null,
        isCorrect,
        timeSpent: 0, // Would calculate actual time spent per question
        flagged: flaggedQuestions.has(question.id)
      };
    });

    setExamResults(results);
    setExamMode('results');

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    if (percentage >= 90) {
      toast.success(`Excellent! You scored ${percentage}%! 🏆`);
    } else if (percentage >= 80) {
      toast.success(`Great job! You scored ${percentage}%! 🎉`);
    } else if (percentage >= 70) {
      toast.info(`Good work! You scored ${percentage}%. Keep studying! 📚`);
    } else {
      toast.info(`You scored ${percentage}%. Review the explanations and try again! 💪`);
    }
  };

  const restartExam = () => {
    setExamMode('setup');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setFlaggedQuestions(new Set());
    setExamResults([]);
    setTimeRemaining(examSettings.duration * 60);
    setIsTimerRunning(false);
  };

  if (examMode === 'setup') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Practice Exam Setup</CardTitle>
            <CardDescription>
              Configure your practice exam settings for the best preparation experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Exam Duration (minutes)</Label>
                  <Select 
                    value={examSettings.duration.toString()} 
                    onValueChange={(value) => setExamSettings(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Number of Questions</Label>
                  <Select 
                    value={examSettings.questionCount.toString()} 
                    onValueChange={(value) => setExamSettings(prev => ({ ...prev, questionCount: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 questions</SelectItem>
                      <SelectItem value="50">50 questions</SelectItem>
                      <SelectItem value="75">75 questions</SelectItem>
                      <SelectItem value="100">100 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={examSettings.difficulty} 
                    onValueChange={(value) => setExamSettings(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Exam Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="showTimer"
                        checked={examSettings.showTimer}
                        onChange={(e) => setExamSettings(prev => ({ ...prev, showTimer: e.target.checked }))}
                      />
                      <Label htmlFor="showTimer">Show timer during exam</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="allowReview"
                        checked={examSettings.allowReview}
                        onChange={(e) => setExamSettings(prev => ({ ...prev, allowReview: e.target.checked }))}
                      />
                      <Label htmlFor="allowReview">Allow question review</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-900">Exam Instructions</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Read each question carefully before selecting your answer</li>
                <li>• You can flag questions for review and return to them later</li>
                <li>• Once you submit, you cannot change your answers</li>
                <li>• Detailed explanations will be provided after submission</li>
                <li>• Take your time and think through each problem systematically</li>
              </ul>
            </div>

            <Button onClick={startExam} size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Play className="h-5 w-5 mr-2" />
              Start Practice Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examMode === 'taking') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Exam Header */}
        <Card className="border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <Progress value={progress} className="w-32 h-2" />
              </div>
              
              {examSettings.showTimer && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-mono">{formatTime(timeRemaining)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                  size="sm"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
                </Button>
                <Button onClick={submitExam} variant="destructive" size="sm">
                  Submit Exam
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={
                      currentQuestion.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {currentQuestion.difficulty}
                    </Badge>
                    <Badge variant="outline">{currentQuestion.category}</Badge>
                    <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                  </div>
                  {flaggedQuestions.has(currentQuestion.id) && (
                    <Flag className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedAnswers[currentQuestion.id]?.toString() || ''} 
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-white/50 transition-colors">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between mt-6">
                  <Button 
                    onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => navigateToQuestion(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const isAnswered = selectedAnswers[question.id] !== undefined;
                    const isFlagged = flaggedQuestions.has(question.id);
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={question.id}
                        onClick={() => navigateToQuestion(index)}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`relative h-10 ${
                          isAnswered ? 'bg-emerald-100 border-emerald-300' : ''
                        } ${isFlagged ? 'ring-2 ring-orange-400' : ''}`}
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border rounded"></div>
                    <span>Not answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-orange-500" />
                    <span>Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (examMode === 'results') {
    const correctAnswers = examResults.filter(r => r.isCorrect).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const totalPoints = examResults.reduce((sum, result, index) => {
      return sum + (result.isCorrect ? questions[index].points : 0);
    }, 0);
    const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Summary */}
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Exam Complete!</CardTitle>
            <CardDescription>
              Here's your detailed performance analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
                <div className="text-sm text-blue-700">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{correctAnswers}/{totalQuestions}</div>
                <div className="text-sm text-emerald-700">Correct</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalPoints}/{maxPoints}</div>
                <div className="text-sm text-purple-700">Points</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{flaggedQuestions.size}</div>
                <div className="text-sm text-orange-700">Flagged</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Question Review</h3>
              {examResults.map((result, index) => {
                const question = questions[index];
                const selectedOption = result.selectedAnswer !== null ? question.options[result.selectedAnswer] : 'No answer';
                const correctOption = question.options[question.correctAnswer];
                
                return (
                  <Card key={question.id} className="border-0 bg-white/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Question {index + 1}</span>
                          {result.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          {result.flagged && <Flag className="h-4 w-4 text-orange-500" />}
                        </div>
                        <Badge variant="secondary">{question.points} pts</Badge>
                      </div>
                      
                      <p className="text-sm mb-3">{question.question}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className={`p-2 rounded ${result.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                          <strong>Your answer:</strong> {selectedOption}
                        </div>
                        {!result.isCorrect && (
                          <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                            <strong>Correct answer:</strong> {correctOption}
                          </div>
                        )}
                        <div className="p-2 rounded bg-blue-50 border border-blue-200">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-4">
              <Button onClick={restartExam} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Exam
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}