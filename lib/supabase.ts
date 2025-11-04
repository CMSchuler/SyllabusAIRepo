import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  console.error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'free' | 'basic' | 'pro';
  subscription_status: 'active' | 'canceled' | 'expired' | 'trial' | 'past_due';
  subscription_start_date: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  usage_stats: {
    files_uploaded_this_month: number;
    study_plans_created_this_month: number;
    practice_exams_taken_this_month: number;
    total_storage_used: number;
  };
  preferences: {
    email_notifications: boolean;
    study_reminders: boolean;
    weekly_reports: boolean;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  course_name: string;
  exam_date?: string;
  study_hours_per_day: number;
  preparedness_level: string;
  content_data?: any;
  metadata?: any;
  output_selection?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  user_id: string;
  study_plan_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  extracted_text?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface PracticeExam {
  id: string;
  user_id: string;
  study_plan_id?: string;
  title: string;
  exam_type: string;
  questions_data: any;
  settings: {
    duration: number;
    question_count: number;
    difficulty: string;
    show_timer: boolean;
    allow_review: boolean;
  };
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  practice_exam_id: string;
  answers: any;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent?: number;
  flagged_questions?: string[];
  completed_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  study_plan_id?: string;
  topic_id?: string;
  progress_type: 'topic_mastered' | 'flashcard_reviewed' | 'question_answered' | 'study_session_completed';
  progress_data?: any;
  created_at: string;
}

// Helper functions for database operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createStudyPlan = async (studyPlan: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('study_plans')
    .insert(studyPlan)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getUserStudyPlans = async (userId: string): Promise<StudyPlan[]> => {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
};

export const saveUploadedFile = async (fileData: Omit<UploadedFile, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('uploaded_files')
    .insert(fileData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createPracticeExam = async (examData: Omit<PracticeExam, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('practice_exams')
    .insert(examData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const saveExamAttempt = async (attemptData: Omit<ExamAttempt, 'id' | 'completed_at'>) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({ ...attemptData, completed_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const trackUserProgress = async (progressData: Omit<UserProgress, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('user_progress')
    .insert(progressData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateUserTier = async (
  userId: string,
  newTier: 'free' | 'basic' | 'pro',
  newStatus: 'active' | 'canceled' | 'expired' | 'trial' | 'past_due' = 'active',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) => {
  const { data, error } = await supabase.rpc('update_user_tier', {
    user_id: userId,
    new_tier: newTier,
    new_status: newStatus,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId
  });

  if (error) {
    throw error;
  }

  return data;
};

export const checkUserLimits = async (userId: string) => {
  const { data, error } = await supabase.rpc('check_user_limits', {
    user_id: userId
  });

  if (error) {
    throw error;
  }

  return data;
};

export const updateUsageStats = async (
  userId: string,
  statType: string,
  incrementValue: number = 1
) => {
  const { data, error } = await supabase.rpc('update_usage_stats', {
    user_id: userId,
    stat_type: statType,
    increment_value: incrementValue
  });

  if (error) {
    throw error;
  }

  return data;
};