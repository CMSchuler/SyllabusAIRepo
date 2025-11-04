import { supabase } from './supabase';

export interface DatabaseSetupResult {
  success: boolean;
  message: string;
  details?: any;
}

export async function verifyDatabaseConnection(): Promise<DatabaseSetupResult> {
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      return {
        success: false,
        message: 'Database connection failed',
        details: error
      };
    }

    return {
      success: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to database',
      details: error
    };
  }
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function verifyAllTables(): Promise<DatabaseSetupResult> {
  const requiredTables = [
    'user_profiles',
    'study_plans',
    'uploaded_files',
    'practice_exams',
    'exam_attempts',
    'user_progress',
    'subscription_history'
  ];

  const missingTables: string[] = [];

  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (!exists) {
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    return {
      success: false,
      message: `Missing tables: ${missingTables.join(', ')}`,
      details: { missingTables }
    };
  }

  return {
    success: true,
    message: 'All required tables exist'
  };
}

export async function verifyUserProfileTrigger(): Promise<DatabaseSetupResult> {
  try {
    // Check if the trigger function exists by trying to call it
    const { data, error } = await supabase.rpc('check_user_limits', { user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (error && error.message.includes('function check_user_limits')) {
      return {
        success: false,
        message: 'Database functions are missing',
        details: error
      };
    }

    return {
      success: true,
      message: 'Database functions are working'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to verify database functions',
      details: error
    };
  }
}

export async function createTestUserProfile(userId: string, email: string): Promise<DatabaseSetupResult> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: 'Test User',
        subscription_tier: 'free',
        subscription_status: 'active'
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to create test user profile',
        details: error
      };
    }

    return {
      success: true,
      message: 'Test user profile created successfully',
      details: data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error creating test user profile',
      details: error
    };
  }
}

export async function runFullDatabaseSetup(): Promise<DatabaseSetupResult[]> {
  const results: DatabaseSetupResult[] = [];

  // 1. Verify connection
  results.push(await verifyDatabaseConnection());

  // 2. Check all tables
  results.push(await verifyAllTables());

  // 3. Verify functions
  results.push(await verifyUserProfileTrigger());

  return results;
}

export async function getCurrentUserProfile(): Promise<DatabaseSetupResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'No authenticated user found'
      };
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return {
        success: false,
        message: 'User profile not found in database',
        details: { userId: user.id, error }
      };
    }

    return {
      success: true,
      message: 'User profile found',
      details: profile
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error retrieving user profile',
      details: error
    };
  }
}