import React from 'react';
import { Shield, Activity, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

interface AdminLoadingProps {
  message?: string;
}

export const AdminLoading: React.FC<AdminLoadingProps> = ({ 
  message = "Verifying admin access..." 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Admin Shield Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Shield className="w-12 h-12 text-white" />
              </div>
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl border-4 border-blue-200 dark:border-blue-800 animate-pulse"></div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Portal
            </h2>
            
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {message}
              </p>
            </div>

            {/* Loading Progress Animation */}
            <div className="space-y-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse delay-75"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse delay-150"></div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Secure Authentication in Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}; 