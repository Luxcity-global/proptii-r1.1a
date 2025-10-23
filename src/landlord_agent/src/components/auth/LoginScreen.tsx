import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Proptii</CardTitle>
          <CardDescription>
            Sign in with your Microsoft account to access your landlord management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in with Microsoft'
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
