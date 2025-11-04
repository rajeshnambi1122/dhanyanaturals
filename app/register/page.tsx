"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/lib/supabase";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    try {
      const signUpData = await authService.signUp(data.email, data.password);
      
      // Create user_data row for the new user
      const user = signUpData.user;
      if (user && user.id) {
        await authService.createUserProfile(user.id, data.name, data.email);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
      // The OAuth callback will handle user profile creation
    } catch (err: any) {
      setError(err.message || "Google signup failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center glass-background page-transition p-4">
      <div className="glass-card p-8 w-full max-w-md mx-auto animate-scale-in">
        <h1 className="text-3xl font-bold mb-6 text-center gradient-text animate-fade-in">Register</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in">
          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input type="text" {...register("name")}
              className="w-full glass-input px-4 py-3 focus-ring" 
              placeholder="Enter your full name" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" {...register("email")}
              className="w-full glass-input px-4 py-3 focus-ring" 
              placeholder="Enter your email" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input type="password" {...register("password")}
              className="w-full glass-input px-4 py-3 focus-ring" 
              placeholder="Enter password (min 6 characters)" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full glass-button py-3 rounded-full hover-lift mt-2">
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              handleGoogleSignUp();
            }}
            disabled={isGoogleLoading}
            className="w-full mt-4 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover-lift"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
          </button>
        </div>
        <p className="mt-6 text-sm text-center">Already have an account? <a href="/login" className="text-green-700 underline hover:text-green-900">Login</a></p>
      </div>
    </div>
  );
} 