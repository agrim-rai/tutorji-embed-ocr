"use client"

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [credits, setCredits] = useState<number>(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && sessionId) {
      // Fetch updated credit balance
      fetchCredits();
    }
  }, [status, sessionId, router]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setPaymentStatus('success');
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setPaymentStatus('error');
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  const handleViewTransactions = () => {
    router.push('/dashboard/transactions');
  };

  if (status === 'loading' || paymentStatus === 'loading') {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Error</h1>
            <p className="text-gray-600 mb-6">
              There was an issue processing your payment. Please contact support if this issue persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return Home
              </button>
              <button
                onClick={() => router.push('/pro')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-green-600">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your credits have been added to your account.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Current Credit Balance</h3>
            <div className="text-3xl font-bold text-blue-600">{credits} credits</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Using Credits
            </button>
            <button
              onClick={handleViewTransactions}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Transaction History
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> Contact our support team if you have any questions about your purchase.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function PaymentSuccessLoading() {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading payment status...</h2>
          <p className="text-gray-600">Please wait a moment.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 