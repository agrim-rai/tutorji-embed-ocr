"use client"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Pricing2 } from "@/components/pricing2"
import Script from "next/script";
import React from "react";

const createOrder = async (amount: number) => {
  const response = await fetch("/api/create-order", {
    method: "POST",
    body: JSON.stringify({ amount: amount * 100 }),
  })
  const data = await response.json();

  const paymentData = {
    key: process.env.RAZORPAY_KEY_ID,
    order_id: data.id,

    handler: async function(response: any) {
      //verify payment
      const verifyResponse = await fetch("/api/verify-payment", {
        method: "POST",
        body: JSON.stringify({ order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id, signature: response.razorpay_signature }),
      })
      const verifyData = await verifyResponse.json();
      console.log(verifyData);

      if(verifyData.isOk) {
        //update user credits
        
      } else {
        console.log("Payment verification failed");
      }
    }

  }

  const payment = new (window as any).Razorpay(paymentData);
  payment.open();
  
};



const demoData = {
  heading: "Pricing",
  description: "Check out our affordable pricing plans",
  plans: [
    {
      id: "bronze",
      name: "Bronze",
      description: "For students who are just starting out and testing their waters",
      price: "₹177",
      features: [
        { text: "100 credits" },
        { text: "Priority support" },
      ],
      button: {
        text: "Purchase",
        url: "https://www.shadcnblocks.com",
      },
    },
    {
      id: "silver",
      name: "Silver",
      description: "For students who are serious about their preparation",
      price: "₹478",
      features: [
        { text: "300 credits" },
        { text: "Priority support" },
        { text: "Early access to some features" },
      ],
      button: {
        text: "Purchase",
        url: "https://www.shadcnblocks.com",
      },
    },
    {
      id: "gold",
      name: "Gold",
      description: "For serious students preparing for competitive exams",
      price: "₹1,416",
      features: [
        { text: "1000 credits" },
        { text: "Priority support" },
        { text: "Early access to all features" },
      ],
      button: {
        text: "Purchase",
        url: "https://www.shadcnblocks.com",
      },
    }
  ],
};

export default function Pricing2Demo() {
  const { data: session, status } = useSession();

  // Create user object from session data
  const [user, setUser] = React.useState(() => session?.user ? {
    name: session.user.name || "",
    email: session.user.email || "",
    credits: session.user.credits || 0
  } : null);

  React.useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name || "",
        email: session.user.email || "",
        credits: session.user.credits || 0
      });
    }
  }, [session]);

  const handleCreditsUpdate = (creditsToAdd: number) => {
    setUser((prev: any) => prev ? { ...prev, credits: (prev.credits || 0) + creditsToAdd } : prev);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Script 
        type="text/javascript"
        src="https://checkout.razorpay.com/v1/checkout.js" 
      />
      <main className="flex-1">
        <Pricing2 {...demoData} user={user} onCreditsUpdate={handleCreditsUpdate} />
      </main>
      <Footer />
    </div>
  );
}
