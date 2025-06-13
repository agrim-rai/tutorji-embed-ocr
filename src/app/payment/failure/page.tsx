"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { XCircle, ArrowRight, Home, RefreshCw, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

function PaymentFailureContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [paymentDetails, setPaymentDetails] = useState({
    orderId: "",
    error: "",
    reason: "",
  })

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    const error = searchParams.get("error")
    const reason = searchParams.get("reason")

    setPaymentDetails({
      orderId: orderId || "",
      error: error || "Payment failed",
      reason: reason || "The payment could not be processed successfully.",
    })
  }, [searchParams])

  const commonReasons = [
    {
      title: "Insufficient Funds",
      description: "Please check if you have sufficient balance in your account or card."
    },
    {
      title: "Network Issues",
      description: "Poor internet connection might have interrupted the payment process."
    },
    {
      title: "Bank Restrictions",
      description: "Your bank might have declined the transaction for security reasons."
    },
    {
      title: "Incorrect Details",
      description: "Please verify your payment details like card number, CVV, or OTP."
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="text-center border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-300">
                Payment Failed
              </CardTitle>
              <p className="text-red-700 dark:text-red-400 mt-2">
                Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-background/80 dark:bg-background/60 rounded-lg p-6 space-y-4 text-left border border-border">
                <h3 className="font-semibold text-foreground mb-3">Error Details</h3>
                
                {paymentDetails.orderId && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                      {paymentDetails.orderId}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-start py-2">
                  <span className="text-muted-foreground">Error:</span>
                  <span className="text-red-600 dark:text-red-400 font-medium text-right max-w-xs">
                    {paymentDetails.error}
                  </span>
                </div>
                
                {session?.user && (
                  <div className="flex justify-between items-center py-2 border-t border-border mt-4 pt-4">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium text-foreground">{session.user.email}</span>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {paymentDetails.reason}
                </AlertDescription>
              </Alert>

              {/* Common Reasons */}
              <div className="bg-background/80 dark:bg-background/60 rounded-lg p-6 text-left border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Common Reasons for Payment Failure
                </h3>
                <div className="space-y-3">
                  {commonReasons.map((reason, index) => (
                    <div key={index} className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-2">
                      <h4 className="font-medium text-foreground">{reason.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{reason.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => router.push("/pro")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Help Section */}
              <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 p-4 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Need Help?</p>
                <p className="mb-2">If you continue to experience issues, please:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-400">
                  <li>Try using a different payment method</li>
                  <li>Contact your bank to ensure online payments are enabled</li>
                  <li>Clear your browser cache and try again</li>
                  <li>Contact our support team with the Order ID above</li>
                </ul>
              </div>

              {/* Contact Support */}
              <Button 
                onClick={() => router.push("/contact")}
                variant="ghost" 
                className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                Contact Support Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function PaymentFailure() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading payment details...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  )
} 