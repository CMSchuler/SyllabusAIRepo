"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/file-upload';
import { PricingModal } from '@/components/pricing-modal';
import { 
  Brain, 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Crown,
  Star,
  FileText,
  Calculator,
  Zap,
  CheckCircle2,
  MessageSquare,
  Upload,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface FormData {
  courseName: string;
  examDate: string;
  topics: string;
  studyHoursPerDay: number;
  preparednessLevel: string;
  pastedContent: string;
}

interface OutputSelection {
  studyGuide: boolean;
  studyPlan: boolean;
  flashcards: boolean;
  practiceQuestions: boolean;
  practiceExam: boolean;
  formulaSheets: boolean;
  homeworkFeedback: boolean;
  questionCount: number;
  flashcardCount: number;
}

export default function UploadPage() {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    courseName: '',
    examDate: '',
    topics: '',
    studyHoursPerDay: 2,
    preparednessLevel: '',
    pastedContent: ''
  });
  const [outputSelection, setOutputSelection] = useState<OutputSelection>({
    studyGuide: true,
    studyPlan: true,
    flashcards: true,
    practiceQuestions: true,
    practiceExam: false,
    formulaSheets: false,
    homeworkFeedback: false,
    questionCount: userTier === 'free' ? 15 : userTier === 'basic' ? 40 : 100,
    flashcardCount: userTier === 'free' ? 20 : userTier === 'basic' ? 50 : 100
  });
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const { profile } = await res.json();
        setUserTier(profile.subscription_tier);
        setOutputSelection(prev => ({
          ...prev,
          questionCount: profile.subscription_tier === 'free' ? 15 : profile.subscription_tier === 'basic' ? 40 : 100,
          flashcardCount: profile.subscription_tier === 'free' ? 20 : profile.subscription_tier === 'basic' ? 50 : 100
        }));
      }
    } catch (error) {
      // Error loading profile
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOutputChange = (field: keyof OutputSelection, value: boolean | number) => {
    setOutputSelection(prev => ({ ...prev, [field]: value }));
  };

  const handleUpgrade = (tier: 'basic' | 'pro') => {
    setUserTier(tier);
    // Update limits based on new tier
    setOutputSelection(prev => ({
      ...prev,
      questionCount: tier === 'basic' ? 40 : 100,
      flashcardCount: tier === 'basic' ? 50 : 100
    }));
    toast.success(`Upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)}! 🎉`);
  };

  const handleNext = () => {
    if (step === 1 && uploadedFiles.length === 0 && !formData.pastedContent.trim()) {
      toast.error('Please upload files or paste your content');
      return;
    }
    if (step === 2 && (!formData.courseName || !formData.examDate || !formData.preparednessLevel)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(step + 1);
  };

  const handleProcess = async () => {
    // Check if any outputs are selected
    const hasSelectedOutputs = Object.entries(outputSelection).some(([key, value]) => 
      key !== 'questionCount' && key !== 'flashcardCount' && value === true
    );

    if (!hasSelectedOutputs) {
      toast.error('Please select at least one output type');
      return;
    }

    // Check tier restrictions
    const requiresBasic = outputSelection.practiceExam || outputSelection.formulaSheets || outputSelection.homeworkFeedback;
    const requiresPro = (outputSelection.practiceExam && userTier === 'free') ||
                       (outputSelection.homeworkFeedback && userTier === 'free');

    if (requiresPro && (userTier === 'free' || userTier === 'basic')) {
      toast.error('Some selected features require PRO subscription');
      setShowPricingModal(true);
      return;
    }

    if (requiresBasic && userTier === 'free') {
      toast.error('Some selected features require Basic or PRO subscription');
      setShowPricingModal(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create FormData object for the API request
      const apiFormData = new FormData();
      
      // Add form fields
      apiFormData.append('courseName', formData.courseName);
      apiFormData.append('examDate', formData.examDate);
      apiFormData.append('topics', formData.topics);
      apiFormData.append('studyHoursPerDay', formData.studyHoursPerDay.toString());
      apiFormData.append('preparednessLevel', formData.preparednessLevel);
      apiFormData.append('pastedContent', formData.pastedContent);

      // Add output selections
      apiFormData.append('outputSelection', JSON.stringify(outputSelection));
      
      // Add files
      uploadedFiles.forEach((file, index) => {
        apiFormData.append(`file-${index}`, file);
      });

      // Show processing messages
      const loadingMessages = [
        'Analyzing your study materials...',
        'Extracting key concepts from multiple sources...',
        'Processing PowerPoint presentations...',
        'Generating personalized study plan...',
        outputSelection.flashcards ? 'Creating interactive flashcards...' : null,
        outputSelection.practiceQuestions ? 'Generating practice questions...' : null,
        outputSelection.practiceExam ? 'Creating full-length practice exam...' : null,
        outputSelection.formulaSheets ? 'Compiling formula sheets...' : null,
        outputSelection.homeworkFeedback ? 'Analyzing homework patterns...' : null,
        'Optimizing your learning schedule...',
        'Finalizing your AI-powered study materials...'
      ].filter(Boolean);

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length) {
          toast.info(loadingMessages[messageIndex]);
          messageIndex++;
        }
      }, 2000);

      // Make API request
      const response = await fetch('/api/generate-study-plan', {
        method: 'POST',
        body: apiFormData,
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate study materials');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate study materials');
      }

      // Data is now saved to database by the API, just redirect to dashboard
      toast.success('🎉 Your AI study materials are ready! Let\'s ace this exam!');
      router.push('/dashboard');

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          toast.error('API quota exceeded. Please try again in a few minutes.');
        } else if (error.message.includes('API key')) {
          toast.error('Service configuration error. Please contact support.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to generate study materials. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const progressValue = ((step - 1) / 3) * 100;

  const getSelectedOutputsCount = () => {
    return Object.entries(outputSelection).filter(([key, value]) => 
      key !== 'questionCount' && key !== 'flashcardCount' && value === true
    ).length;
  };

  const getTierLimits = () => {
    switch (userTier) {
      case 'basic':
        return { files: 10, fileSize: '25MB', totalSize: '50MB', questions: 40, flashcards: 50 };
      case 'pro':
        return { files: 25, fileSize: '100MB', totalSize: '200MB', questions: 'Unlimited', flashcards: 'Unlimited' };
      default:
        return { files: 3, fileSize: '5MB', totalSize: '10MB', questions: 15, flashcards: 20 };
    }
  };

  const limits = getTierLimits();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Syllabus AI</span>
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Let's Create Your <span className="gradient-text">Perfect Study Materials</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Upload multiple files and customize your AI-generated study experience
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{step}/4</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>

        {/* Current Plan Display */}
        <Card className="border-0 bg-white/60 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userTier === 'pro' ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : userTier === 'basic' ? (
                  <Zap className="h-5 w-5 text-blue-500" />
                ) : (
                  <Star className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <span className="font-medium">
                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {limits.files} files • {limits.fileSize} each • {limits.questions} questions • {limits.flashcards} flashcards
                  </p>
                </div>
              </div>
              {userTier !== 'pro' && (
                <Button 
                  size="sm" 
                  onClick={() => setShowPricingModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Upload Content */}
        {step === 1 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Upload Your Study Materials</CardTitle>
              <CardDescription>
                Upload multiple files (PDF, DOCX, PPTX, TXT, MD) or paste content directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload 
                onFileSelect={setUploadedFiles} 
                selectedFiles={uploadedFiles}
                userTier={userTier}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste content</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Paste Your Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your syllabus, notes, or study material here..."
                  value={formData.pastedContent}
                  onChange={(e) => handleInputChange('pastedContent', e.target.value)}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 100 characters required for effective analysis
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                <ArrowRight className="h-5 w-5 mr-2" />
                Continue to Exam Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Exam Details */}
        {step === 2 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Tell Us About Your Exam</CardTitle>
              <CardDescription>
                Help us create the perfect study materials tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course">Course Name *</Label>
                  <Input
                    id="course"
                    placeholder="e.g., Organic Chemistry, Data Structures"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examDate">Exam Date *</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => handleInputChange('examDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Key Topics (Optional)</Label>
                <Textarea
                  id="topics"
                  placeholder="List the main topics you need to focus on..."
                  value={formData.topics}
                  onChange={(e) => handleInputChange('topics', e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Study Hours Per Day</Label>
                  <Select 
                    value={formData.studyHoursPerDay.toString()} 
                    onValueChange={(value) => handleInputChange('studyHoursPerDay', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="5">5+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Preparedness Level *</Label>
                  <Select 
                    value={formData.preparednessLevel} 
                    onValueChange={(value) => handleInputChange('preparednessLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">📚 Just getting started</SelectItem>
                      <SelectItem value="intermediate">📖 Some knowledge</SelectItem>
                      <SelectItem value="advanced">🎯 Well prepared</SelectItem>
                      <SelectItem value="review">✅ Just need review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Choose Outputs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Output Selection */}
        {step === 3 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Choose Your Study Materials</CardTitle>
              <CardDescription>
                Select which AI-generated materials you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Features */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Free Features
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
                    <Checkbox
                      id="studyGuide"
                      checked={outputSelection.studyGuide}
                      onCheckedChange={(checked) => handleOutputChange('studyGuide', checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="studyGuide" className="font-medium cursor-pointer">
                        Study Guide
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive topic summaries and key concepts
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
                    <Checkbox
                      id="studyPlan"
                      checked={outputSelection.studyPlan}
                      onCheckedChange={(checked) => handleOutputChange('studyPlan', checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="studyPlan" className="font-medium cursor-pointer">
                        Study Schedule
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Personalized daily study calendar
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
                    <Checkbox
                      id="flashcards"
                      checked={outputSelection.flashcards}
                      onCheckedChange={(checked) => handleOutputChange('flashcards', checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="flashcards" className="font-medium cursor-pointer">
                        Flashcards
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Interactive cards for key terms and concepts
                      </p>
                      {outputSelection.flashcards && (
                        <div className="mt-2">
                          <Label className="text-xs">Number of flashcards:</Label>
                          <Select 
                            value={outputSelection.flashcardCount.toString()} 
                            onValueChange={(value) => handleOutputChange('flashcardCount', parseInt(value))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 cards</SelectItem>
                              <SelectItem value="20">20 cards</SelectItem>
                              {userTier !== 'free' && <SelectItem value="30">30 cards</SelectItem>}
                              {userTier !== 'free' && <SelectItem value="50">50 cards</SelectItem>}
                              {userTier === 'pro' && <SelectItem value="100">100 cards</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
                    <Checkbox
                      id="practiceQuestions"
                      checked={outputSelection.practiceQuestions}
                      onCheckedChange={(checked) => handleOutputChange('practiceQuestions', checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="practiceQuestions" className="font-medium cursor-pointer">
                        Practice Questions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Multiple choice questions with explanations
                      </p>
                      {outputSelection.practiceQuestions && (
                        <div className="mt-2">
                          <Label className="text-xs">Number of questions:</Label>
                          <Select 
                            value={outputSelection.questionCount.toString()} 
                            onValueChange={(value) => handleOutputChange('questionCount', parseInt(value))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 questions</SelectItem>
                              <SelectItem value="15">15 questions</SelectItem>
                              {userTier !== 'free' && <SelectItem value="25">25 questions</SelectItem>}
                              {userTier !== 'free' && <SelectItem value="40">40 questions</SelectItem>}
                              {userTier === 'pro' && <SelectItem value="60">60 questions</SelectItem>}
                              {userTier === 'pro' && <SelectItem value="100">100 questions</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <Target className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Basic/PRO Features */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Premium Features
                  {userTier === 'free' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Upgrade Required</Badge>}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`flex items-start space-x-3 p-3 rounded-lg border ${userTier === 'free' ? 'opacity-60 bg-gray-50' : 'bg-white/50'}`}>
                    <Checkbox
                      id="practiceExam"
                      checked={outputSelection.practiceExam}
                      onCheckedChange={(checked) => handleOutputChange('practiceExam', checked as boolean)}
                      disabled={userTier === 'free'}
                    />
                    <div className="flex-1">
                      <Label htmlFor="practiceExam" className={`font-medium ${userTier === 'free' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        Practice Exams
                        {userTier === 'basic' && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">Basic+</Badge>}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {userTier === 'basic' ? '1 exam per week' : userTier === 'pro' ? 'Unlimited exams' : 'Complete timed exam simulation'}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>

                  <div className={`flex items-start space-x-3 p-3 rounded-lg border ${userTier === 'free' ? 'opacity-60 bg-gray-50' : 'bg-white/50'}`}>
                    <Checkbox
                      id="formulaSheets"
                      checked={outputSelection.formulaSheets}
                      onCheckedChange={(checked) => handleOutputChange('formulaSheets', checked as boolean)}
                      disabled={userTier === 'free'}
                    />
                    <div className="flex-1">
                      <Label htmlFor="formulaSheets" className={`font-medium ${userTier === 'free' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        Formula Sheets
                        {userTier === 'basic' && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">Basic+</Badge>}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Organized reference sheets with key formulas
                      </p>
                    </div>
                    <Calculator className="h-5 w-5 text-purple-600" />
                  </div>

                  <div className={`flex items-start space-x-3 p-3 rounded-lg border ${userTier === 'free' ? 'opacity-60 bg-gray-50' : 'bg-white/50'}`}>
                    <Checkbox
                      id="homeworkFeedback"
                      checked={outputSelection.homeworkFeedback}
                      onCheckedChange={(checked) => handleOutputChange('homeworkFeedback', checked as boolean)}
                      disabled={userTier === 'free'}
                    />
                    <div className="flex-1">
                      <Label htmlFor="homeworkFeedback" className={`font-medium ${userTier === 'free' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        Homework Feedback
                        {userTier === 'basic' && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">Basic+</Badge>}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        AI analysis of your work to identify weak areas
                      </p>
                    </div>
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>

                  {userTier === 'pro' && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <Label className="font-medium">Advanced Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Detailed performance insights and learning patterns
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">PRO</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-emerald-900">Selection Summary</h4>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {getSelectedOutputsCount()} items selected
                  </Badge>
                </div>
                <p className="text-sm text-emerald-700">
                  Files: {uploadedFiles.length} • Content: {formData.pastedContent ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={getSelectedOutputsCount() === 0}>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Review & Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Generate */}
        {step === 4 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Ready to Generate Your Study Materials</CardTitle>
              <CardDescription>
                Review your selections and let AI create your personalized learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Course Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Course:</span>
                      <span>{formData.courseName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Exam Date:</span>
                      <span>{new Date(formData.examDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Daily Study:</span>
                      <span>{formData.studyHoursPerDay} hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Files:</span>
                      <span>{uploadedFiles.length} uploaded</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Selected Materials</h3>
                  <div className="space-y-2">
                    {outputSelection.studyGuide && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Study Guide</span>
                      </div>
                    )}
                    {outputSelection.studyPlan && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Study Schedule</span>
                      </div>
                    )}
                    {outputSelection.flashcards && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{outputSelection.flashcardCount} Flashcards</span>
                      </div>
                    )}
                    {outputSelection.practiceQuestions && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{outputSelection.questionCount} Practice Questions</span>
                      </div>
                    )}
                    {outputSelection.practiceExam && (
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span>Practice Exams</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {userTier === 'basic' ? 'Basic' : 'PRO'}
                        </Badge>
                      </div>
                    )}
                    {outputSelection.formulaSheets && (
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span>Formula Sheets</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {userTier === 'basic' ? 'Basic' : 'PRO'}
                        </Badge>
                      </div>
                    )}
                    {outputSelection.homeworkFeedback && (
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span>Homework Feedback</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {userTier === 'basic' ? 'Basic' : 'PRO'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">What we'll create for you:</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  {outputSelection.studyGuide && <li>• Comprehensive study guide with key concepts</li>}
                  {outputSelection.studyPlan && <li>• Daily study schedule until your exam date</li>}
                  {outputSelection.flashcards && <li>• Interactive flashcards for memorization</li>}
                  {outputSelection.practiceQuestions && <li>• Practice questions with detailed explanations</li>}
                  {outputSelection.practiceExam && <li>• Full-length timed practice exams</li>}
                  {outputSelection.formulaSheets && <li>• Organized formula reference sheets</li>}
                  {outputSelection.homeworkFeedback && <li>• AI-powered homework analysis and feedback</li>}
                  <li>• Progress tracking and performance analytics</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleProcess} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isProcessing || getSelectedOutputsCount() === 0}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate My Study Materials
                    </>
                  )}
                </Button>
              </div>
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