"use client"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Pricing2 } from "@/components/pricing2"

const demoData = {
  heading: "Pricing",
  description: "Check out our affordable pricing plans",
  plans: [
    {
      id: "bronze",
      name: "Bronze",
      description: "For students who are just starting out and testing their waters",
      monthlyPrice: "₹177",
      yearlyPrice: "₹147",
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
      monthlyPrice: "₹478",
      yearlyPrice: "₹398",
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
      monthlyPrice: "₹1,416",
      yearlyPrice: "₹1,180",
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
  const user = session?.user ? {
    name: session.user.name || "",
    email: session.user.email || "",
    credits: session.user.credits || 0
  } : null;

  return (
    <div>
      <Navbar />
      <Pricing2 {...demoData} user={user} />
      <Footer />
    </div>
  );
}
