/**
 * Sign In Page
 * 
 * Handles user authentication with Google OAuth
 * Displays user info if already logged in
 */
"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaGoogle, FaUser, FaSpinner, FaLock, FaCoins, FaDiscord, FaReddit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Import constants for logo paths
const PRODIJEE_LOGO_DARK = "/logo-ct.png";

export default function SignIn() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect to home page if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Redirect after a short delay to show the welcome message
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [session, status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        <div className="bg-gray-900 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div>
                <h1 className="text-xl font-bold">ProdiJEE</h1>
                <p className="text-xs opacity-80">AI Doubt Solver</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <div className="inline-block animate-pulse">
              <FaSpinner className="animate-spin h-12 w-12 mx-auto text-indigo-600" />
            </div>
            <p className="mt-4 text-xl font-medium">Preparing your learning journey...</p>
          </div>
        </div>
        
        <footer className="bg-gray-900 text-gray-300 py-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">ProdiJEE.in • Powered by AI • © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    );
  }

  // If user is authenticated, show user info and credits
  if (status === "authenticated" && session) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        <div className="bg-gray-900 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div>
                <h1 className="text-xl font-bold">ProdiJEE</h1>
                <p className="text-xs opacity-80">AI Doubt Solver</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-xl shadow-md transition-all duration-500 animate-fadeIn">
            <div className="text-center">
              <div className="flex justify-center animate-bounce-slow">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name} 
                    className="h-20 w-20 rounded-full border-4 border-indigo-600 shadow-lg" 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {session.user.name?.charAt(0) || <FaUser />}
                  </div>
                )}
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">
                Welcome, {session.user.name}!
              </h2>
              <p className="mt-2 text-gray-400">
                You are signed in as {session.user.email}
              </p>
              <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-inner">
                <div className="flex items-center justify-center space-x-2 text-indigo-400">
                  <FaCoins className="h-5 w-5" />
                  <p className="text-lg font-bold">
                    {session.user.credits || '25'} Credits
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-300">
                  Each question costs 1 credit to solve
                </p>
              </div>
              <p className="mt-6 text-sm text-indigo-400 animate-pulse">
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        </div>
        
        <footer className="bg-gray-900 text-gray-300 py-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">ProdiJEE.in • Powered by AI • © {new Date().getFullYear()}</p>
            
            <div className="mt-3 flex justify-center items-center space-x-6">
              <a 
                href="https://discord.gg/uKYFCXHvYg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xl text-gray-400 hover:text-indigo-400 transition-colors"
                aria-label="Join our Discord"
              >
                <FaDiscord />
              </a>
              <a 
                href="https://reddit.com/u/morrisbishnoi29" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xl text-gray-400 hover:text-indigo-400 transition-colors"
                aria-label="Follow us on Reddit"
              >
                <FaReddit />
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Default sign-in form for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div>
              <h1 className="text-xl font-bold">ProdiJEE</h1>
              <p className="text-xs opacity-80">AI Doubt Solver</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8 p-8 bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="text-center">
            <div className="flex justify-center mb-6 animate-bounce-slow">
              <div className="w-20 h-20">
                <img 
                  src={PRODIJEE_LOGO_DARK}
                  alt="ProdiJEE Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome to ProdiJEE
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Your AI-powered learning assistant for JEE preparation
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-gray-700 bg-gray-750">
              <div className="flex items-center space-x-3 mb-3">
                <FaLock className="h-5 w-5 text-indigo-500" />
                <h3 className="font-medium">Google Sign-In Only</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                We only accept Google accounts to prevent abuse of our free credit system. This helps us:
              </p>
              <ul className="text-sm text-gray-400 space-y-2 mb-3 pl-5 list-disc">
                <li>Keep the service free for genuine students</li>
                <li>Prevent multiple accounts from the same person</li>
                <li>Maintain high quality of service for everyone</li>
              </ul>
              <div className="flex items-center space-x-3 mt-4 bg-gray-700 p-3 rounded-lg">
                <FaCoins className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">25 Free Credits for New Users</p>
                  <p className="text-xs text-gray-400">Each question costs 1 credit to solve</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaGoogle className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
              </span>
              {isLoading ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Signing in...
                </span>
              ) : (
                "Sign in with Google"
              )}
            </button>
            
            <div className="text-sm text-center mt-6 space-y-3">
              <p className="text-gray-400">
                Running AI models is expensive. To provide this service for free, we limit each account to 25 free credits.
              </p>
              <p className="text-gray-400">
                By signing in, you agree to our{" "}
                <a href="#" className="font-medium text-indigo-400 underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-indigo-400 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-900 text-gray-300 py-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">ProdiJEE.in • Powered by AI • © {new Date().getFullYear()}</p>
          
          <div className="mt-3 flex justify-center items-center space-x-6">
            <a 
              href="https://discord.gg/uKYFCXHvYg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xl text-gray-400 hover:text-indigo-400 transition-colors"
              aria-label="Join our Discord"
            >
              <FaDiscord />
            </a>
            <a 
              href="https://reddit.com/u/morrisbishnoi29" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xl text-gray-400 hover:text-indigo-400 transition-colors"
              aria-label="Follow us on Reddit"
            >
              <FaReddit />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
} 