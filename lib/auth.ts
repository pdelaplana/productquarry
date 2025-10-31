import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OTPData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  token: string;
}

export const authHelpers = {
  // Sign up new user with password
  async signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) throw error;
    return authData;
  },

  // Sign in existing user with password
  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  },

  // Send OTP code to email (works for both new and existing users)
  async sendOTP(data: OTPData) {
    const { data: authData, error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true, // Automatically create user if they don't exist
        emailRedirectTo: undefined, // Disable magic link redirect
      },
    });

    if (error) throw error;
    return authData;
  },

  // Verify OTP code (completes sign in/sign up)
  async verifyOTP(data: VerifyOTPData) {
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'email',
    });

    if (error) throw error;
    return authData;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
