"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
import { PracticeExam } from '@/components/practice-exam';
import { 
  Brain, 
  FileText, 
  Upload, 
  Target, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface ExamGenerationData {
  examType: 'content-based' | 'similar-exam';
  courseName: string;
  examDuration: number;
  questionCount: number;
  difficulty: string;
  topics: string;
  content: string;
  file: File | null;
}

export default function PracticeExamPage() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState(null);
  const [formData, setFormData] = useState<ExamGenerationData>({
    examType: 'content-based',
    courseName: '',
    examDuration: 120,
    questionCount: 50,
    difficulty: 'mixed',
    topics: '',
    content: '',
    file: null
  });
  const router = useRouter();

  const handleInputChange = (field: keyof ExamGenerationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.file && !formData.content.trim()) {
      toast.error('Please upload a file or paste your content');
      return;
    }
    setStep(step + 1);
  };

  const generateExam = async () => {
    if (!formData.courseName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create FormData object for the API request
      const apiFormData = new FormData();
      
      // Add form fields
      apiFormData.append('examType', formData.examType);
      apiFormData.append('courseName', formData.courseName);
      apiFormData.append('examDuration', formData.examDuration.toString());
      apiFormData.append('questionCount', formData.questionCount.toString());
      apiFormData.append('difficulty', formData.difficulty);
      apiFormData.append('topics', formData.topics);
      apiFormData.append('content', formData.content);
      
      // Add file if uploaded
      if (formData.file) {
        apiFormData.append('file', formData.file);
      }

      // Show processing messages
      const loadingMessages = [
        'Analyzing your content...',
        'Generating exam questions...',
        'Creating answer explanations...',
        'Optimizing question difficulty...',
        'Finalizing your practice exam...'
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length) {
          toast.info(loadingMessages[messageIndex]);
          messageIndex++;
        }
      }, 2000);

      // Make API request to generate exam
      const response = await fetch('/api/generate-practice-exam', {
        method: 'POST',
        body: apiFormData,
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate practice exam');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate practice exam');
      }

      setGeneratedExam(result.data);
      toast.success('🎉 Your practice exam is ready!');
      setStep(3);

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
        toast.error('Failed to generate practice exam. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (step === 3 && generatedExam) {
    return <PracticeExam examData={generatedExam} />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Syllabus AI</span>
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Generate Your <span className="gradient-text">Practice Exam</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Create comprehensive practice exams from your study materials or similar exams
          </p>
        </div>

        {/* Step 1: Content Upload */}
        {step === 1 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Upload Exam Content</CardTitle>
              <CardDescription>
                Upload study materials, previous exams, or paste content to generate your practice exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Exam Generation Type</Label>
                <Select 
                  value={formData.examType} 
                  onValueChange={(value: 'content-based' | 'similar-exam') => handleInputChange('examType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content-based">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Generate from Study Materials
                      </div>
                    </SelectItem>
                    <SelectItem value="similar-exam">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Create Similar to Uploaded Exam
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FileUpload onFileSelect={(file) => handleInputChange('file', file)} selectedFiles={formData.file ? [formData.file] : []} />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste content</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {formData.examType === 'content-based' ? 'Study Material Content' : 'Previous Exam Content'}
                </Label>
                <Textarea
                  id="content"
                  placeholder={
                    formData.examType === 'content-based' 
                      ? "Paste your study materials, lecture notes, or textbook content here..."
                      : "Paste a previous exam or sample questions here..."
                  }
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 200 characters required for effective exam generation
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {formData.examType === 'content-based' ? 'Content-Based Generation' : 'Similar Exam Generation'}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {formData.examType === 'content-based' 
                        ? 'AI will analyze your study materials and create comprehensive exam questions covering all key concepts.'
                        : 'AI will analyze the structure and style of your uploaded exam to create similar questions with different content.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                <ArrowRight className="h-5 w-5 mr-2" />
                Continue to Exam Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Exam Configuration */}
        {step === 2 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Configure Your Exam</CardTitle>
              <CardDescription>
                Set up the parameters for your personalized practice exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input
                    id="courseName"
                    placeholder="e.g., Organic Chemistry, Data Structures"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exam Duration</Label>
                  <Select 
                    value={formData.examDuration.toString()} 
                    onValueChange={(value) => handleInputChange('examDuration', parseInt(value))}
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
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select 
                    value={formData.questionCount.toString()} 
                    onValueChange={(value) => handleInputChange('questionCount', parseInt(value))}
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

                <div className="space-y-2">
                  <Label>Difficulty Distribution</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value) => handleInputChange('difficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Mostly Easy</SelectItem>
                      <SelectItem value="medium">Mostly Medium</SelectItem>
                      <SelectItem value="hard">Mostly Hard</SelectItem>
                      <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Focus Topics (Optional)</Label>
                <Textarea
                  id="topics"
                  placeholder="List specific topics you want the exam to focus on..."
                  value={formData.topics}
                  onChange={(e) => handleInputChange('topics', e.target.value)}
                />
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="font-semibold mb-3 text-emerald-900">Your exam will include:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-emerald-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Multiple choice questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Detailed explanations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Timed exam simulation</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Question flagging system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Performance analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Review mode</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={generateExam} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Practice Exam
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}