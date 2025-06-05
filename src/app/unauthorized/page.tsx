"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignIn = () => {
    signIn('google');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-8"
            >
              <Shield className="w-12 h-12 text-red-600 dark:text-red-400" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Access Denied
            </motion.h1>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              {status === 'loading' ? (
                <p className="text-gray-600 dark:text-gray-300">
                  Checking your permissions...
                </p>
              ) : !session ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    You need to be signed in to access this area.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please sign in with your authorized account.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    You don't have permission to access this admin area.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This area is restricted to administrators only. If you believe you should have access, please contact the system administrator.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-3"
            >
              {!session ? (
                <>
                  <Button
                    onClick={handleSignIn}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                </>
              )}
            </motion.div>

            {/* User Info */}
            {session && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Signed in as: <span className="font-medium">{session.user?.email}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Role: {session.user?.role || 'user'}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 