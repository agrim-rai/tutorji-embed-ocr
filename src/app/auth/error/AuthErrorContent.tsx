"use client";

import { useSearchParams } from "next/navigation";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages = {
    default: {
      title: "Authentication Error",
      message: "An error occurred during the sign-in process. Please try again.",
    },
    NotAllowed: {
      title: "Access Denied",
      message: "You do not have permission to sign in. Please contact support if you believe this is an error.",
    },
    AccessDenied: {
      title: "Access Denied",
      message: "You do not have permission to sign in. Please contact support if you believe this is an error.",
    },
    Verification: {
      title: "Verification Error",
      message: "The verification link is invalid or has expired. Please try signing in again.",
    },
    OAuthSignin: {
      title: "OAuth Sign In Error",
      message: "There was a problem starting the OAuth sign-in process. Please try again.",
    },
    OAuthCallback: {
      title: "OAuth Callback Error",
      message: "There was a problem during the OAuth sign-in process. Please try again.",
    },
    SessionRequired: {
      title: "Session Required",
      message: "You need to be signed in to access this page. Please sign in first.",
    },
    Callback: {
      title: "Callback Error",
      message: "There was a problem with the authentication callback. Please try again.",
    },
    Configuration: {
      title: "Configuration Error",
      message: "There is a problem with the server configuration. Please contact support.",
    },
  };

  const errorDetails = errorMessages[error as keyof typeof errorMessages] ?? errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <FaExclamationTriangle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {errorDetails.title}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {errorDetails.message}
          </p>
        </div>

        <div className="text-center">
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center space-x-2 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
            >
              <FaArrowLeft className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            If the problem persists, please contact support at{" "}
            <a
              href="mailto:support@prodijee.com"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              support@prodijee.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
