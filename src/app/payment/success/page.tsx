"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CheckCircle, ArrowRight, Home, CreditCard, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [paymentDetails, setPaymentDetails] = useState({
    orderId: "",
    paymentId: "",
    amount: "",
    credits: "",
  })
  const [currentCredits, setCurrentCredits] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Function to fetch current credits from API
  const fetchCurrentCredits = async () => {
    if (!session?.user?.email) return
    
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setCurrentCredits(data.credits)
      } else {
        console.error('Failed to fetch credits:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    const paymentId = searchParams.get("paymentId")
    const amount = searchParams.get("amount")
    const credits = searchParams.get("credits")

    if (orderId && paymentId) {
      setPaymentDetails({
        orderId: orderId || "",
        paymentId: paymentId || "",
        amount: amount || "",
        credits: credits || "",
      })
    }
  }, [searchParams])

  // Fetch current credits when session is available
  useEffect(() => {
    if (session?.user?.email) {
      fetchCurrentCredits()
    }
  }, [session])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="text-center border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-300">
                Payment Successful!
              </CardTitle>
              <p className="text-green-700 dark:text-green-400 mt-2">
                Your payment has been processed successfully and credits have been added to your account.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Payment Details */}
              <div className="bg-background/80 dark:bg-background/60 rounded-lg p-6 space-y-4 text-left border border-border">
                <h3 className="font-semibold text-foreground mb-3">Payment Details</h3>
                
                {paymentDetails.orderId && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                      {paymentDetails.orderId}
                    </span>
                  </div>
                )}
                
                {paymentDetails.paymentId && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                      {paymentDetails.paymentId}
                    </span>
                  </div>
                )}
                
                {paymentDetails.amount && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ₹{paymentDetails.amount}
                    </span>
                  </div>
                )}
                
                {paymentDetails.credits && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Credits Added:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {paymentDetails.credits} credits
                    </span>
                  </div>
                )}

                {currentCredits !== null && (
                  <div className="flex justify-between items-center py-2 border-t border-border mt-4 pt-4">
                    <span className="text-muted-foreground">Current Total Credits:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CreditCard className="h-5 w-5" />
                        {currentCredits} credits
                      </span>
                      <Button
                        onClick={fetchCurrentCredits}
                        disabled={isRefreshing}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                )}
                
                {session?.user && (
                  <div className="flex justify-between items-center py-2 border-t border-border mt-4 pt-4">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium text-foreground">{session.user.email}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => router.push("/")}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => router.push("/pro")}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Pricing
                </Button>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">What's Next?</p>
                <p>Your credits are now available in your account. You can start using them immediately for tutoring sessions and other premium features.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function PaymentSuccess() {
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
      <PaymentSuccessContent />
    </Suspense>
  )
} 