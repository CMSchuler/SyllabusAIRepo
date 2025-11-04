"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyCalendar } from '@/components/study-calendar';
import { FlashCards } from '@/components/flashcards';
import { QuizMode } from '@/components/quiz-mode';
import { StudyGuide } from '@/components/study-guide';
import { PricingModal } from '@/components/pricing-modal';
import { StudyPlanSchema } from '@/lib/openai';
import { 
  Brain, 
  Calendar, 
  BookOpen, 
  Target, 
  Trophy, 
  Clock, 
  TrendingUp,
  Flame,
  Star,
  CheckCircle2,
  PlayCircle,
  Settings,
  AlertCircle,
  FileText,
  Plus,
  Crown,
  Calculator,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OutputSelection {
  studyGuide: boolean;
  studyPlan: boolean;
  flashcards: boolean;
  practiceQuestions: boolean;
  practiceExam: boolean;
  formulaSheets: boolean;
  questionCount: number;
  flashcardCount: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [studyPlanData, setStudyPlanData] = useState<StudyPlanSchema | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [outputSelection, setOutputSelection] = useState<OutputSelection | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile');
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const { profile } = await profileRes.json();
      setUserTier(profile.subscription_tier);

      // Fetch study plans
      const plansRes = await fetch('/api/study-plans?active=true');
      if (!plansRes.ok) {
        throw new Error('Failed to fetch study plans');
      }

      const { studyPlans } = await plansRes.json();

      if (studyPlans && studyPlans.length > 0) {
        // Load the most recent active study plan
        const latestPlan = studyPlans[0];
        setStudyPlanData(latestPlan.content_data);
        setMetadata({
          courseName: latestPlan.course_name,
          examDate: latestPlan.exam_date,
          preparednessLevel: latestPlan.preparedness_level,
          studyHoursPerDay: latestPlan.study_hours_per_day,
          ...latestPlan.metadata
        });
        setOutputSelection(latestPlan.output_selection);
      } else {
        // No study plans found, redirect to upload
        router.push('/upload');
        return;
      }

      // Calculate study streak from user progress
      // For now, set to 0 until we implement progress tracking
      setCurrentStreak(0);

      setIsLoading(false);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setIsLoading(false);
      router.push('/upload');
    }
  };

  const handleUpgrade = () => {
    setShowPricingModal(true);
    // In a real app, this would handle the payment flow
  };

  if (!mounted || isLoading || !studyPlanData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your study materials...</p>
        </div>
      </div>
    );
  }

  // Calculate progress metrics
  const totalTopics = studyPlanData.studyGuide?.topics?.length || 0;
  const completedTopics = studyPlanData.studyGuide?.topics?.filter(topic => topic.mastered).length || 0;
  const totalProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Calculate days remaining
  const examDate = metadata?.examDate ? new Date(metadata.examDate) : new Date();
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Get today's tasks from study calendar
  const todaysTasks = studyPlanData.studyCalendar?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
  }) || [];

  const completedToday = todaysTasks.filter(task => task.completed).length;
  const totalToday = todaysTasks.length;
  const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  // Determine available tabs based on generated content
  const availableTabs = [];
  if (outputSelection?.studyGuide && studyPlanData.studyGuide) {
    availableTabs.push({ id: 'study-guide', label: 'Study Guide', icon: BookOpen });
  }
  if (outputSelection?.flashcards && studyPlanData.flashcards) {
    availableTabs.push({ id: 'flashcards', label: 'Flashcards', icon: Star });
  }
  if (outputSelection?.practiceQuestions && studyPlanData.quizQuestions) {
    availableTabs.push({ id: 'quiz', label: 'Quiz', icon: Target });
  }
  if (outputSelection?.studyPlan && studyPlanData.studyCalendar) {
    availableTabs.push({ id: 'calendar', label: 'Calendar', icon: Calendar });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Syllabus AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              {/* PRO Features */}
              {outputSelection?.practiceExam && (
                <Link href="/practice-exam">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Practice Exam
                    {userTier !== 'pro' && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
                  </Button>
                </Link>
              )}
              
              {userTier !== 'pro' && (
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={() => setShowPricingModal(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to PRO
                </Button>
              )}
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">{currentStreak} day streak</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            You're doing great! Keep up the momentum and ace that {metadata?.courseName || 'exam'}.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
                  <p className="text-2xl font-bold text-red-600">{daysRemaining}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{totalProgress}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Topics Mastered</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {completedTopics}/{totalTopics}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                  <p className="text-2xl font-bold text-orange-600">{currentStreak} days</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRO Features CTA */}
        {userTier !== 'pro' && (outputSelection?.practiceExam || outputSelection?.formulaSheets) && (
          <Card className="border-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Crown className="h-6 w-6" />
                    Unlock PRO Features
                  </h3>
                  <p className="text-yellow-100 mb-4">
                    You've selected PRO features! Upgrade now to access practice exams, formula sheets, and unlimited questions.
                  </p>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => setShowPricingModal(true)}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to PRO
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <Crown className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice Exam CTA */}
        {outputSelection?.practiceExam && userTier === 'pro' && (
          <Card className="border-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Ready for a Practice Exam?</h3>
                  <p className="text-purple-100 mb-4">
                    Test your knowledge with a full-length practice exam generated from your study materials.
                  </p>
                  <Link href="/practice-exam">
                    <Button variant="secondary" size="lg">
                      <FileText className="h-5 w-5 mr-2" />
                      Take Practice Exam
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Progress */}
        {todaysTasks.length > 0 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Today's Study Plan
                  </CardTitle>
                  <CardDescription>
                    {completedToday} of {totalToday} tasks completed
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {Math.round(todayProgress)}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={todayProgress} className="mb-6" />
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                    <div className="flex items-center space-x-3">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className={`font-medium ${task.completed ? 'text-emerald-700 line-through' : ''}`}>
                          {task.title}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.duration}
                        </p>
                      </div>
                    </div>
                    {!task.completed && (
                      <Button size="sm" variant="outline">
                        Start
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        {availableTabs.length > 0 && (
          <Tabs defaultValue={availableTabs[0].id} className="space-y-6">
            <TabsList className="grid w-full bg-white/60 backdrop-blur-sm" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {outputSelection?.studyGuide && studyPlanData.studyGuide && (
              <TabsContent value="study-guide">
                <StudyGuide studyGuideData={studyPlanData.studyGuide} />
              </TabsContent>
            )}

            {outputSelection?.flashcards && studyPlanData.flashcards && (
              <TabsContent value="flashcards">
                <FlashCards flashcardsData={studyPlanData.flashcards} />
              </TabsContent>
            )}

            {outputSelection?.practiceQuestions && studyPlanData.quizQuestions && (
              <TabsContent value="quiz">
                <QuizMode quizData={studyPlanData.quizQuestions} />
              </TabsContent>
            )}

            {outputSelection?.studyPlan && studyPlanData.studyCalendar && (
              <TabsContent value="calendar">
                <StudyCalendar calendarData={studyPlanData.studyCalendar} />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* No Content Message */}
        {availableTabs.length === 0 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Study Materials Generated</h3>
              <p className="text-muted-foreground mb-6">
                It looks like no study materials were generated. Please go back and select at least one output type.
              </p>
              <Link href="/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Study Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}