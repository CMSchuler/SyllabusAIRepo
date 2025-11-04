/*
  # User Management and Subscription System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `subscription_tier` (enum: free, basic, pro)
      - `subscription_status` (enum: active, canceled, expired, trial)
      - `subscription_start_date` (timestamptz)
      - `subscription_end_date` (timestamptz)
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `usage_stats` (jsonb)
      - `preferences` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `study_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `course_name` (text)
      - `exam_date` (date)
      - `study_hours_per_day` (integer)
      - `preparedness_level` (text)
      - `content_data` (jsonb)
      - `metadata` (jsonb)
      - `output_selection` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `uploaded_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `study_plan_id` (uuid, references study_plans)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (bigint)
      - `file_url` (text)
      - `extracted_text` (text)
      - `processing_status` (enum: pending, processing, completed, failed)
      - `created_at` (timestamptz)

    - `practice_exams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `study_plan_id` (uuid, references study_plans)
      - `title` (text)
      - `exam_type` (text)
      - `questions_data` (jsonb)
      - `settings` (jsonb)
      - `created_at` (timestamptz)

    - `exam_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `practice_exam_id` (uuid, references practice_exams)
      - `answers` (jsonb)
      - `score` (integer)
      - `total_questions` (integer)
      - `time_spent` (integer)
      - `completed_at` (timestamptz)

    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `study_plan_id` (uuid, references study_plans)
      - `topic_id` (text)
      - `progress_type` (enum: topic_mastered, flashcard_reviewed, question_answered)
      - `progress_data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for admin access

  3. Functions
    - Update user tier function
    - Usage tracking functions
    - Subscription management functions
*/

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'trial', 'past_due');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE progress_type AS ENUM ('topic_mastered', 'flashcard_reviewed', 'question_answered', 'study_session_completed');

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  usage_stats jsonb DEFAULT '{
    "files_uploaded_this_month": 0,
    "study_plans_created_this_month": 0,
    "practice_exams_taken_this_month": 0,
    "total_storage_used": 0
  }'::jsonb,
  preferences jsonb DEFAULT '{
    "email_notifications": true,
    "study_reminders": true,
    "weekly_reports": true,
    "theme": "light"
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  course_name text NOT NULL,
  exam_date date,
  study_hours_per_day integer DEFAULT 2,
  preparedness_level text,
  content_data jsonb,
  metadata jsonb,
  output_selection jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Uploaded Files Table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  study_plan_id uuid REFERENCES study_plans(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text,
  extracted_text text,
  processing_status processing_status DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Practice Exams Table
CREATE TABLE IF NOT EXISTS practice_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  study_plan_id uuid REFERENCES study_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  exam_type text DEFAULT 'content-based',
  questions_data jsonb NOT NULL,
  settings jsonb DEFAULT '{
    "duration": 120,
    "question_count": 50,
    "difficulty": "mixed",
    "show_timer": true,
    "allow_review": true
  }'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Exam Attempts Table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  practice_exam_id uuid REFERENCES practice_exams(id) ON DELETE CASCADE NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage integer GENERATED ALWAYS AS (ROUND((score::float / total_questions::float) * 100)) STORED,
  time_spent integer, -- in seconds
  flagged_questions text[],
  completed_at timestamptz DEFAULT now()
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  study_plan_id uuid REFERENCES study_plans(id) ON DELETE CASCADE,
  topic_id text,
  progress_type progress_type NOT NULL,
  progress_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Subscription History Table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  previous_tier subscription_tier,
  new_tier subscription_tier NOT NULL,
  change_reason text,
  stripe_event_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for study_plans
CREATE POLICY "Users can read own study plans"
  ON study_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study plans"
  ON study_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study plans"
  ON study_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "Users can read own files"
  ON uploaded_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own files"
  ON uploaded_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON uploaded_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON uploaded_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for practice_exams
CREATE POLICY "Users can read own practice exams"
  ON practice_exams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own practice exams"
  ON practice_exams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice exams"
  ON practice_exams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice exams"
  ON practice_exams
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for exam_attempts
CREATE POLICY "Users can read own exam attempts"
  ON exam_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exam attempts"
  ON exam_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_progress
CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subscription_history
CREATE POLICY "Users can read own subscription history"
  ON subscription_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscription history"
  ON subscription_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Functions for user management
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user tier
CREATE OR REPLACE FUNCTION update_user_tier(
  user_id uuid,
  new_tier subscription_tier,
  new_status subscription_status DEFAULT 'active',
  stripe_customer_id text DEFAULT NULL,
  stripe_subscription_id text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  old_tier subscription_tier;
BEGIN
  -- Get current tier
  SELECT subscription_tier INTO old_tier
  FROM user_profiles
  WHERE id = user_id;

  -- Update user profile
  UPDATE user_profiles
  SET 
    subscription_tier = new_tier,
    subscription_status = new_status,
    subscription_start_date = CASE 
      WHEN old_tier != new_tier THEN now()
      ELSE subscription_start_date
    END,
    stripe_customer_id = COALESCE(update_user_tier.stripe_customer_id, user_profiles.stripe_customer_id),
    stripe_subscription_id = COALESCE(update_user_tier.stripe_subscription_id, user_profiles.stripe_subscription_id),
    updated_at = now()
  WHERE id = user_id;

  -- Log subscription change
  IF old_tier != new_tier THEN
    INSERT INTO subscription_history (user_id, previous_tier, new_tier, change_reason)
    VALUES (user_id, old_tier, new_tier, 'Subscription update');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user limits
CREATE OR REPLACE FUNCTION check_user_limits(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_tier subscription_tier;
  usage jsonb;
  limits jsonb;
BEGIN
  -- Get user tier
  SELECT subscription_tier, usage_stats INTO user_tier, usage
  FROM user_profiles
  WHERE id = user_id;

  -- Set limits based on tier
  CASE user_tier
    WHEN 'free' THEN
      limits := '{
        "max_files": 3,
        "max_file_size_mb": 5,
        "max_total_size_mb": 10,
        "max_questions": 15,
        "max_flashcards": 20,
        "max_practice_exams_per_month": 0
      }'::jsonb;
    WHEN 'basic' THEN
      limits := '{
        "max_files": 10,
        "max_file_size_mb": 25,
        "max_total_size_mb": 50,
        "max_questions": 40,
        "max_flashcards": 50,
        "max_practice_exams_per_month": 4
      }'::jsonb;
    WHEN 'pro' THEN
      limits := '{
        "max_files": 25,
        "max_file_size_mb": 100,
        "max_total_size_mb": 200,
        "max_questions": -1,
        "max_flashcards": -1,
        "max_practice_exams_per_month": -1
      }'::jsonb;
  END CASE;

  RETURN jsonb_build_object(
    'tier', user_tier,
    'limits', limits,
    'usage', usage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage stats
CREATE OR REPLACE FUNCTION update_usage_stats(
  user_id uuid,
  stat_type text,
  increment_value integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    usage_stats = jsonb_set(
      usage_stats,
      ARRAY[stat_type],
      to_jsonb((COALESCE((usage_stats->>stat_type)::integer, 0) + increment_value))
    ),
    updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (to be called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET usage_stats = jsonb_set(
    jsonb_set(
      jsonb_set(
        usage_stats,
        '{files_uploaded_this_month}',
        '0'
      ),
      '{study_plans_created_this_month}',
      '0'
    ),
    '{practice_exams_taken_this_month}',
    '0'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_created_at ON study_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_study_plan_id ON uploaded_files(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_exams_user_id ON practice_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_practice_exam_id ON exam_attempts(practice_exam_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_study_plan_id ON user_progress(study_plan_id);