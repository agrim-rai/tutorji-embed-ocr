"use client";

import { ArrowRight, CircleCheck, User, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: PricingFeature[];
  button: {
    text: string;
    url: string;
  };
}

interface User {
  name: string;
  email: string;
  credits?: number;
}

interface Pricing2Props {
  heading?: string;
  description?: string;
  plans?: PricingPlan[];
  user?: User | null;
  onCreditsUpdate?: (credits: number) => void;
}

const planCredits: Record<string, number> = {
  bronze: 100,
  silver: 300,
  gold: 1000,
};

const planAmounts: Record<string, number> = {
  bronze: 177,
  silver: 478,
  gold: 1416,
};

const Pricing2 = ({
  heading = "Pricing",
  description = "Check out our affordable pricing plans",
  user = null,
  plans = [
    {
      id: "plus",
      name: "Plus",
      description: "For personal use",
      price: "$19",
      features: [
        { text: "Up to 5 team members" },
        { text: "Basic components library" },
        { text: "Community support" },
        { text: "1GB storage space" },
      ],
      button: {
        text: "Purchase",
        url: "https://www.shadcnblocks.com",
      },
    },
    {
      id: "pro",
      name: "Pro",
      description: "For professionals",
      price: "$49",
      features: [
        { text: "Unlimited team members" },
        { text: "Advanced components" },
        { text: "Priority support" },
        { text: "Unlimited storage" },
      ],
      button: {
        text: "Purchase",
        url: "https://www.shadcnblocks.com",
      },
    },
  ],
  onCreditsUpdate,
}: Pricing2Props) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const handlePurchase = async (planId: string) => {
    if (!user) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    try {
      setLoadingPlan(planId);
      const amount = planAmounts[planId];
      if (!amount) throw new Error("Invalid plan");
      // Create order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, planType: planId }),
      });
      
      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.id) throw new Error("Order creation failed - no order ID received");
      
      // Check if Razorpay is loaded
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error("Razorpay not loaded. Please refresh the page and try again.");
      }
      
      // Razorpay payment
      const paymentData = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: data.id,
        handler: async function(response: any) {
          //verify payment
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              orderId: response.razorpay_order_id, 
              razorpayPaymentId: response.razorpay_payment_id, 
              razorpaySignature: response.razorpay_signature 
            }),
          });
          
          if (!verifyResponse.ok) {
            window.location.href = `/payment/failure?orderId=${response.razorpay_order_id}&error=Verification request failed&reason=Unable to verify payment with server`;
            return;
          }
          
          const verifyData = await verifyResponse.json();
          if(verifyData.isOk) {
            //update user credits
            if (onCreditsUpdate) {
              onCreditsUpdate(planCredits[planId]);
            }
            // Redirect to success page
            window.location.href = `/payment/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}&amount=${amount}&credits=${planCredits[planId]}`;
          } else {
            window.location.href = `/payment/failure?orderId=${response.razorpay_order_id}&error=Payment verification failed&reason=Payment could not be verified successfully`;
          }
        },
        modal: {
          ondismiss: function() {
            window.location.href = `/payment/failure?error=Payment cancelled&reason=Payment was cancelled by user`;
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#6366f1" },
      };
      const payment = new (window as any).Razorpay(paymentData);
      payment.open();
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during purchase';
      window.location.href = `/payment/failure?error=${encodeURIComponent(errorMessage)}&reason=${encodeURIComponent('Please try again or contact support if the issue persists')}`;
      setLoadingPlan(null);
    }
  };

  const handleSignIn = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:gap-8 text-center">
          <div className="space-y-4">
            <h2 className="text-pretty text-3xl font-bold sm:text-4xl lg:text-5xl xl:text-6xl">
              {heading}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-3xl">
              {description}
            </p>
          </div>

          
          {/* User info display when signed in */}
          {user && (
            <div className="w-full max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Buying credits for:</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">({user.email})</span>
                  {user.credits !== undefined && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                      {user.credits} credits
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Sign in alert when not authenticated */}
          {!user && (
            <Alert className="max-w-md w-full">
              <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span>Please sign in to purchase a plan</span>
                <Button onClick={handleSignIn} size="sm" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col justify-between text-left h-full ${
                  plan.id === 'silver' ? 'ring-2 ring-primary relative scale-105' : ''
                }`}
              >
                {plan.id === 'silver' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium z-10">
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl lg:text-2xl">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                  <div className="pt-2">
                    <span className="text-3xl lg:text-4xl font-bold">
                      {plan.price}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      One-time payment
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CircleCheck className="size-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button 
                    onClick={() => handlePurchase(plan.id)}
                    className="w-full h-11"
                    disabled={loadingPlan === plan.id}
                    variant={plan.id === 'silver' ? 'default' : 'outline'}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {!user ? "Sign In to Purchase" : plan.button.text}
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Security and payment info */}
          <div className="mt-8 lg:mt-12 text-center text-sm text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-2">
              🔒 Secure payment powered by Razorpay
            </p>
            <p>All transactions are encrypted and secure</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing2 };
