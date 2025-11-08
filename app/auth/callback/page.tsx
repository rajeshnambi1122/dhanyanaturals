"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService, supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          router.push("/login");
          return;
        }

        if (data.session && data.session.user) {
          // Handle OAuth callback to create user profile if needed
          await authService.handleOAuthCallback(data.session.user);
          
          // Redirect to home page
          router.push("/");
        } else {
          // If no session, redirect to login
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    };

    // Small delay to ensure URL hash is processed
    const timer = setTimeout(handleOAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center glass-background">
      <div className="glass-card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completing Authentication...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}