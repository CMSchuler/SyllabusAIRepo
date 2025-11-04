"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  User,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { 
  runFullDatabaseSetup, 
  getCurrentUserProfile, 
  createTestUserProfile,
  DatabaseSetupResult 
} from '@/lib/supabase-setup';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function DatabaseSetup() {
  const [isChecking, setIsChecking] = useState(false);
  const [setupResults, setSetupResults] = useState<DatabaseSetupResult[]>([]);
  const [userProfileResult, setUserProfileResult] = useState<DatabaseSetupResult | null>(null);
  const { user } = useAuth();

  const runDatabaseCheck = async () => {
    setIsChecking(true);
    try {
      const results = await runFullDatabaseSetup();
      setSetupResults(results);
      
      // Also check current user profile
      const profileResult = await getCurrentUserProfile();
      setUserProfileResult(profileResult);
      
      const allSuccessful = results.every(r => r.success) && profileResult.success;
      
      if (allSuccessful) {
        toast.success('Database setup verification completed successfully! 🎉');
      } else {
        toast.error('Database setup issues detected. Please review the results.');
      }
    } catch (error) {
      toast.error('Failed to run database verification');
    } finally {
      setIsChecking(false);
    }
  };

  const createUserProfile = async () => {
    if (!user) {
      toast.error('No authenticated user found');
      return;
    }

    setIsChecking(true);
    try {
      const result = await createTestUserProfile(user.id, user.email || '');
      
      if (result.success) {
        toast.success('User profile created successfully!');
        // Refresh the profile check
        const profileResult = await getCurrentUserProfile();
        setUserProfileResult(profileResult);
      } else {
        toast.error('Failed to create user profile');
      }
    } catch (error) {
      toast.error('Error creating user profile');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className={success ? "bg-emerald-100 text-emerald-800" : ""}>
        {success ? "✓ OK" : "✗ Failed"}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Supabase Database Setup Verification
          </CardTitle>
          <CardDescription>
            Verify that your Supabase database is properly configured with all required tables and functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={runDatabaseCheck} 
              disabled={isChecking}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isChecking ? 'Checking...' : 'Run Database Check'}
            </Button>

            {user && userProfileResult && !userProfileResult.success && (
              <Button 
                onClick={createUserProfile} 
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                Create User Profile
              </Button>
            )}
          </div>

          {/* Database Setup Results */}
          {setupResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Database Setup Results</h3>
              <div className="grid gap-3">
                {setupResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-white/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.success)}
                      <span className="font-medium">{result.message}</span>
                    </div>
                    {getStatusBadge(result.success)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Profile Status */}
          {userProfileResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current User Profile Status</h3>
              <div className="p-4 rounded-lg border bg-white/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(userProfileResult.success)}
                    <span className="font-medium">{userProfileResult.message}</span>
                  </div>
                  {getStatusBadge(userProfileResult.success)}
                </div>
                
                {userProfileResult.details && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(userProfileResult.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>If you see any failures:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>1. Make sure your Supabase project is active and accessible</li>
                <li>2. Verify your environment variables in .env.local are correct</li>
                <li>3. Check that the migration file has been applied to your Supabase database</li>
                <li>4. Ensure RLS policies are enabled and configured correctly</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Environment Variables Check */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}