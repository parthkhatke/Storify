import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Loader2, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-card border border-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading STORIFY...</span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Index;
