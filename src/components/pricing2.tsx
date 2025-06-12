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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initiateCheckout } from "@/lib/stripeClient";

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
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
}

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Helper function to parse price string and extract number
const parsePrice = (priceString: string): number => {
  return Number(priceString.slice(1).replace(/,/g, ''));
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
      monthlyPrice: "$19",
      yearlyPrice: "$15",
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
      monthlyPrice: "$49",
      yearlyPrice: "$35",
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
}: Pricing2Props) => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handlePurchase = async (planId: string) => {
    if (!user) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    try {
      setError(null);
      setLoadingPlan(planId);
      
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      await initiateCheckout(planId, billingPeriod);
      
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during purchase');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSignIn = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  return (
    <section className="py-32">
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-pretty text-4xl font-bold lg:text-6xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-xl">{description}</p>
          
          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* User info display when signed in */}
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <User className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Buying credits for account:</span>
              <span className="font-semibold">{user.name}</span>
              <span className="text-muted-foreground">({user.email})</span>
              {user.credits !== undefined && (
                <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                  {user.credits} credits
                </span>
              )}
            </div>
          )}
          
          {/* Sign in alert when not authenticated */}
          {!user && (
            <Alert className="max-w-md">
              <AlertDescription className="flex items-center justify-between">
                <span>Please sign in to purchase a plan</span>
                <Button onClick={handleSignIn} size="sm" variant="outline">
                  Sign In
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-3 text-lg">
            Monthly
            <Switch
              checked={isYearly}
              onCheckedChange={() => setIsYearly(!isYearly)}
            />
            Yearly
            {isYearly && (
              <span className="text-sm text-green-600 font-medium">
                Save up to 20%!
              </span>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-6 md:flex-row">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex w-80 flex-col justify-between text-left ${
                  plan.id === 'silver' ? 'ring-2 ring-primary relative' : ''
                }`}
              >
                {plan.id === 'silver' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>
                    <p>{plan.name}</p>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <span className="text-4xl font-bold">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      / month
                    </span>
                  </span>
                  
                  <p className="text-sm text-muted-foreground">
                    {isYearly ? (
                      <>
                        Billed ₹{formatNumber(parsePrice(plan.yearlyPrice) * 12)} annually
                      </>
                    ) : (
                      <>Billed monthly</>
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CircleCheck className="size-4" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button 
                    onClick={() => handlePurchase(plan.id)}
                    className="w-full"
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
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>🔒 Secure payment powered by Stripe</p>
            <p>All transactions are encrypted and secure</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing2 };
