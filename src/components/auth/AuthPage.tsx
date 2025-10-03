import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Mail, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const otpSchema = z.string().length(6, 'OTP must be 6 digits');

export const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authService.sendOtp(email);

      if (error) {
        if (error.message.includes('rate limit')) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please wait a moment before requesting another code',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'OTP sent!',
        description: `Check your email at ${email} for the verification code`,
      });
      setStep('otp');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      otpSchema.parse(otp);
    } catch (error) {
      toast({
        title: 'Invalid OTP',
        description: 'OTP must be 6 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authService.verifyOtp(email, otp);
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Welcome!',
        description: 'Successfully logged in',
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: 'Invalid OTP',
        description: error.message || 'Please check your code and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setOtp('');
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-card border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Storify
          </h1>
          <p className="text-muted-foreground">
            Secure file storage with client-side encryption
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              {step === 'otp' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToEmail}
                  className="p-1 h-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {step === 'email' ? 'Login / Sign Up' : 'Verify Email'}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your email to receive a secure code. New users will be automatically registered.'
                : `Enter the 6-digit code sent to ${email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => handleSendOtp(new Event('submit') as any)}
                    className="text-sm"
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secured with end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
};