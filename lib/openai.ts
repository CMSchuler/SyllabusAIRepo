import OpenAI from 'openai';

// Only initialize OpenAI client if API key is available
// This prevents errors during build time when env vars might not be set
const apiKey = process.env.OPENAI_API_KEY || 'dummy-key-for-build';

// Create OpenAI instance with error handling
export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: false,
});

// Helper function to check if OpenAI is properly configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-build';
}

// Helper function to validate OpenAI before use
export function validateOpenAI(): void {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
  }
}

export const STUDY_PLAN_SYSTEM_PROMPT = `You are an expert educational AI that creates comprehensive, personalized study plans. Your task is to analyze the provided study materials and generate a structured JSON response containing study guides, flashcards, and quiz questions.

CRITICAL: You must return ONLY valid JSON that matches the exact schema provided. Do not include any explanatory text, markdown formatting, or additional commentary outside the JSON structure.

The JSON response must include:
1. A comprehensive study guide with topics, definitions, and learning objectives
2. Interactive flashcards for key concepts and terms
3. Multiple-choice quiz questions with explanations
4. Difficulty levels and time estimates for each component

Ensure all content is:
- Academically accurate and well-structured
- Appropriate for the specified preparedness level
- Focused on the exam date and study timeline
- Comprehensive yet digestible for effective learning`;

export interface StudyPlanSchema {
  studyGuide: {
    courseTitle: string;
    summary: string;
    keyLearningObjectives: string[];
    studyStrategy: string;
    examTips: string[];
    topics: Array<{
      id: string;
      title: string;
      summary: string;
      keyPoints: string[];
      difficulty: 'easy' | 'medium' | 'hard';
      estimated_time: string;
      mastered: boolean;
    }>;
    definitions: Array<{
      term: string;
      definition: string;
      example?: string;
    }>;
  };
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    mastered: boolean;
  }>;
  quizQuestions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
  }>;
  studyCalendar: Array<{
    id: string;
    date: string;
    title: string;
    duration: string;
    type: 'study' | 'review' | 'quiz' | 'break';
    completed: boolean;
  }>;
}