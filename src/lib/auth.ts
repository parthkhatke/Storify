import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  // Generate and send OTP via custom email
  async sendOtp(email: string) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if user already has credentials stored
      const { data: existingCred } = await supabase
        .from('user_credentials')
        .select('password_hash')
        .eq('email', email)
        .maybeSingle();
      
      // Use existing password or generate new one
      const password = existingCred?.password_hash || 
        (Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12));
      
      // Store OTP with expiration (10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      // Store OTP in database with password
      const { error: dbError } = await supabase
        .from('otp_verifications')
        .insert({
          email,
          otp_code: otp,
          password: password,
          expires_at: expiresAt,
          verified: false
        });

      if (dbError) throw dbError;

      // Store or update user credentials only if new user
      if (!existingCred) {
        const { error: credError } = await supabase
          .from('user_credentials')
          .insert({
            email,
            password_hash: password
          });

        if (credError) throw credError;
      }

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp }
      });

      if (emailError) throw emailError;

      return { error: null };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { error };
    }
  },

  // Verify OTP and create session directly
  async verifyOtp(email: string, token: string) {
    try {
      // Call edge function to verify OTP and create session with admin privileges
      const { data, error } = await supabase.functions.invoke('verify-otp-and-login', {
        body: { email, otp: token }
      });

      if (error || !data?.success) {
        throw error || new Error(data?.error || 'Failed to verify OTP');
      }

      // If verification succeeded, get the user credentials and sign in
      const { data: credData } = await supabase
        .from('user_credentials')
        .select('password_hash')
        .eq('email', email)
        .maybeSingle();

      const password = credData?.password_hash || 
        (Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12));

      // Store credentials if new user
      if (!credData) {
        await supabase.from('user_credentials').insert({
          email,
          password_hash: password
        });
      }

      // Try to sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, update the user's password and try again
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (signUpError && !signUpError.message?.includes('already')) {
          throw signUpError;
        }

        // Try signing in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) throw retryError;
        return { data: retryData, error: null };
      }

      return { data: signInData, error: null };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Setup auth state change listener
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};