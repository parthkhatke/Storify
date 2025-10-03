import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, LogOut, User, Clock, ChevronDown } from 'lucide-react';
import { FileUpload } from '@/components/files/FileUpload';
import { FileList } from '@/components/files/FileList';
import { DeveloperCard } from '@/components/dashboard/DeveloperCard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been securely signed out',
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const formatJoinDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                STORIFY
              </h1>
              <p className="hidden sm:block text-xs text-muted-foreground">End-to-end encrypted storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{user?.email}</span>
              <Badge variant="outline" className="text-xs">Verified</Badge>
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back!</h2>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Manage your encrypted files securely
                </p>
              </div>

              {user?.created_at && (
                <Card className="md:block border-primary/20 bg-primary/5 w-full md:w-auto">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Member since</span>
                      <span className="font-medium">{formatJoinDate(user.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-6">
              <FileUpload onUploadComplete={() => setRefreshTrigger(prev => prev + 1)} />
            </div>

            <div className="space-y-6">
              <FileList key={refreshTrigger} />
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="space-y-6">
            {/* Developer Team */}
            <DeveloperCard />

            {/* Security Status */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Status
                </CardTitle>
                <CardDescription className="text-sm">Comprehensive security overview and protection details</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Always Visible Security Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <span className="text-sm font-medium text-muted-foreground">Authentication</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">OTP Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <span className="text-sm font-medium text-muted-foreground">Encryption</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">AES-256 Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <span className="text-sm font-medium text-muted-foreground">Storage</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">Private Bucket</Badge>
                  </div>
                </div>

                {/* Collapsible Detailed Information */}
                <Collapsible>
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-border/50">
                    <span className="font-medium text-sm">View Detailed Security Information</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 sm:pt-6">
                    <div className="space-y-6">
                      {/* Additional Security Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground">Data Protection</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> End-to-end encryption</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Zero-knowledge architecture</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Secure file deletion</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Row-level security</li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground">Access Control</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> One-time password login</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Secure session management</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> User-specific access</li>
                            <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Auto timeout protection</li>
                          </ul>
                        </div>
                      </div>

                      {/* Security Status Summary */}
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center">
                          All systems operational • Last checked: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-12 sm:mt-16">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">STORIFY</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} STORIFY. End-to-end encrypted storage.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>Secure</span>
              <span>•</span>
              <span>Private</span>
              <span>•</span>
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
